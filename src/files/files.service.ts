import { Injectable } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { File } from "./files.model";
import { Repository } from "typeorm";
import { UsersService } from "../users/users.service";
import { CreateFileDto } from "./dto/create-file.dto";
import { RenameFileDto } from "./dto/rename-file.dto";
import { ChangeFileLikesDto } from "./dto/change-file-likes.dto";
import { ChangeFileContentDto } from "./dto/change-file-content.dto";
import { User } from "../users/users.model";
import { DeleteFileDto } from "./dto/delete-file.dto";
import { ImagesService } from "../images/images.service";

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        private readonly userService: UsersService,
        private readonly imagesService: ImagesService
    ) {}

    async getAllForUser(email: string): Promise<File[]> {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new Error(`User with email ${email} not found`);
        }

        const treeRepository = this.fileRepository.manager.getTreeRepository(File);

        const roots = await this.fileRepository.createQueryBuilder('file')
            .leftJoinAndSelect('file.author', 'author')
            .where('author.id = :userId', { userId: user.id })
            .andWhere('file.parent IS NULL')
            .orderBy('file.name', 'ASC')
            .select([
                'file',
                'author.email',
            ])
            .getMany();

        return await Promise.all(
            roots.map(root => treeRepository.findDescendantsTree(root)),
        );
    }

    async checkIfUserLikedFile(id: number, email: string): Promise<boolean> {
        const file = await this.fileRepository.findOne({ where: { id } });
        if (!file) {
            throw new Error(`File with id ${id} not found`);
        }

        const likedBy = file.likedEmails || [];
        const index = likedBy.indexOf(email);

        return index !== -1;
    }

    async saveFileTree(dto: CreateFileDto, author: User, parentFile: File | null = null): Promise<File> {
        const fileLikes = dto.likes ? dto.likes : 0;
        const file = this.fileRepository.create({
            type: dto.type,
            name: dto.name,
            content: dto.content,
            status: 'Closed',
            likes: fileLikes,
            author,
            parent: parentFile,
            lastEditor: dto.author,
        });

        const savedFile = await this.fileRepository.save(file);

        if (dto.children && dto.children.length > 0) {
            for (const childDto of dto.children) {
                await this.saveFileTree(childDto, author, savedFile);
            }
        }

        const treeRepository = this.fileRepository.manager.getTreeRepository(File);

        if (dto.type === 'File') {
            await this.userService.changeAmountOfFiles(author.email, -1);
        }

        return await treeRepository.findDescendantsTree(savedFile);
    }

    async saveFileTreeForUser(dto: CreateFileDto): Promise<File> {
        const user = await this.userService.findByEmail(dto.author);
        if (!user) {
            throw new Error(`User with email ${dto.author} not found`);
        }

        let parentFile: File | null = null;
        if (dto.parent !== null && dto.parent !== undefined) {
            parentFile = await this.fileRepository.findOne({ where: { id: dto.parent } });
            if (!parentFile) {
                throw new Error(`Parent file with id ${dto.parent} not found`);
            }
        }

        return await this.saveFileTree(dto, user, parentFile);
    }

    async changeLikes(dto: ChangeFileLikesDto): Promise<File> {
        const file = await this.fileRepository.findOne({ where: { id: dto.id } });
        if (!file) {
            throw new Error(`File with id ${dto.id} not found`);
        }

        const likedBy = file.likedEmails || [];
        const index = likedBy.indexOf(dto.email);

        if (index === -1) {
            likedBy.push(dto.email);
        } else {
            likedBy.splice(index, 1);
        }

        file.likedEmails = likedBy;
        file.likes = likedBy.length;

        return await this.fileRepository.save(file);
    }

    async changeName(dto: RenameFileDto): Promise<File> {
        const file = await this.fileRepository.findOne({ where: { id: dto.id } });
        if (!file) {
            throw new Error(`File with id ${dto.id} not found`);
        }

        file.name = dto.name;

        return await this.fileRepository.save(file);
    }

    async changeContent(dto: ChangeFileContentDto): Promise<File> {
        const file = await this.fileRepository.findOne({ where: { id: dto.id } });
        if (!file) {
            throw new Error(`File with id ${dto.id} not found`);
        }

        file.content = dto.content;
        file.lastEditor = dto.editor;

        return await this.fileRepository.save(file);
    }

    async deleteFileTree(dto: DeleteFileDto): Promise<number> {
        const { id, email } = dto;
        const treeRepository = this.fileRepository.manager.getTreeRepository(File);

        const root = await this.fileRepository.findOne({ where: { id } });
        if (!root) {
            throw new Error(`File with id ${id} not found`);
        }

        const tree = await treeRepository.findDescendantsTree(root);

        const extractImagePaths = (content: string): string[] => {
            const imageRegex = /\[image\/([^.\[\]]+\.(png|jpg|jpeg|gif|webp))]/g;
            const imagePaths: string[] = [];
            let match: string[] | null;

            while ((match = imageRegex.exec(content)) !== null) {
                imagePaths.push(match[1]);
            }
            return imagePaths;
        };

        const collectAllContent = (file: File): string[] => {
            let contents: string[] = [];
            if (file.content) {
                contents.push(file.content);
            }
            if (file.children && file.children.length > 0) {
                for (const child of file.children) {
                    contents = contents.concat(collectAllContent(child));
                }
            }
            return contents;
        };

        const allContents = collectAllContent(tree);
        const allImageNames: Set<string> = new Set();

        for (const content of allContents) {
            const imageNames = extractImagePaths(content);
            imageNames.forEach(name => allImageNames.add(name));
        }

        const collectIds = (file: File): number[] => {
            let ids = [file.id];
            if (file.children && file.children.length > 0) {
                for (const child of file.children) {
                    ids = ids.concat(collectIds(child));
                }
            }
            return ids;
        };

        const idsToRemove = collectIds(tree);

        const filesOnly = await this.fileRepository
            .createQueryBuilder('file')
            .where('file.id IN (:...ids)', { ids: idsToRemove })
            .andWhere('file.type = :fileType', { fileType: 'File' })
            .getMany();

        const filesCount = filesOnly.length;

        for (const imageName of Array.from(allImageNames)) {
            try {
                const imagePath = await this.imagesService.getImagePathByName(imageName);
                require('fs').unlinkSync(imagePath);
            } catch (error) {
                console.warn(`Image ${imageName} not found or already deleted`);
            }
        }

        await this.fileRepository.delete(idsToRemove);

        if (filesCount > 0) {
            await this.userService.deleteAmountOfFiles(email, filesCount);
        }

        return id;
    }
}