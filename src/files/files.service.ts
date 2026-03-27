import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {File} from "./files.model";
import {Repository} from "typeorm";
import {UsersService} from "../users/users.service";
import {CreateFileDto} from "./dto/create-file.dto";
import {RenameFileDto} from "./dto/rename-file.dto";
import {ChangeFileLikesDto} from "./dto/change-file-likes.dto";
import {ChangeFileContentDto} from "./dto/change-file-content.dto";
import {User} from "../users/users.model";
import {DeleteFileDto} from "./dto/delete-file.dto";
import {ImagesService} from "../images/images.service";
import {GetFilesForUserDto} from "./dto/get-file-for-user.dto";
import {FileDto} from './types/file-dto';

@Injectable()
export class FilesService {
    constructor(
        @InjectRepository(File)
        private readonly fileRepository: Repository<File>,
        private readonly userService: UsersService,
        private readonly imagesService: ImagesService
    ) {
    }

    async getAllForUser(dto: GetFilesForUserDto): Promise<FileDto[]> {
        const {viewedUserEmail, loggedInUserEmail} = dto;

        const user = await this.userService.findByEmail(viewedUserEmail);

        if (!user) {
            throw new Error(`User with email ${viewedUserEmail} not found`);
        }

        const treeRepository = this.fileRepository.manager.getTreeRepository(File);

        const roots = await this.fileRepository.createQueryBuilder('file')
            .leftJoinAndSelect('file.author', 'author')
            .where('author.id = :userId', {userId: user.id})
            .andWhere('file.parent IS NULL')
            .orderBy('file.name', 'ASC')
            .select([
                'file',
                'author.email',
            ])
            .getMany();

        const trees = await Promise.all(
            roots.map(root => treeRepository.findDescendantsTree(root)),
        );

        const addIsLikedToTree = (files: File[], loggedInUserEmail: string) => {
            return files.map(file => {
                const isLiked = file.type === "File"
                    ? file.likedEmails.includes(loggedInUserEmail) || false
                    : false;

                const fileDto: FileDto = {
                    id: file.id,
                    type: file.type,
                    name: file.name,
                    content: file.content,
                    status: file.status,
                    likes: file.likes,
                    lastEditor: file.lastEditor,
                    author: file.author,
                    parent: file.parent ? file.parent.id : null,
                    children: file.children.length
                        ? addIsLikedToTree(file.children, loggedInUserEmail)
                        : [],
                    isLiked
                };

                return fileDto;
            })
        }

        return addIsLikedToTree(trees.flat(), loggedInUserEmail || '');
    }

    async checkIfUserLikedFile(id: number, email: string): Promise<boolean> {
        const file = await this.fileRepository.findOne({where: {id}});
        if (!file) {
            throw new Error(`File with id ${id} not found`);
        }

        const likedBy = file.likedEmails || [];
        const index = likedBy.indexOf(email);

        return index !== -1;
    }

    private async saveFileTree(
        dto: CreateFileDto,
        loggedInUser: User,
        parentFile: File | null = null,
        targetUser: User,
    ): Promise<File> {


        const fileLikes = dto.likes ? dto.likes : 0;
        const file = this.fileRepository.create({
            type: dto.type,
            name: dto.name,
            content: dto.content,
            status: 'Closed',
            likes: fileLikes,
            author: targetUser,
            parent: parentFile,
            lastEditor: loggedInUser.email,
        });

        const savedFile = await this.fileRepository.save(file);

        if (dto.children && dto.children.length > 0) {
            for (const childDto of dto.children) {
                await this.saveFileTree(childDto, loggedInUser, savedFile, targetUser);
            }
        }

        const treeRepository = this.fileRepository.manager.getTreeRepository(File);

        if (dto.type === 'File') {
            await this.userService.changeAmountOfFiles(targetUser.email, -1);
        }

        return await treeRepository.findDescendantsTree(savedFile);
    }

    async saveFileTreeForUser(
        dto: CreateFileDto,
        loggedInUser: User
    ): Promise<FileDto> {
        const user = await this.userService.findByEmail(loggedInUser.email);
        if (!user) throw new Error(`User with email ${loggedInUser.email} not found`);

        const targetUser = await this.userService.findByEmail(dto.targetUserEmail);
        if (!targetUser) throw new Error(`User with email ${dto.targetUserEmail} not found`);

        if (targetUser.email !== user.email) {
            if (!targetUser.whoCanEdit.includes(user)) throw new Error(`User with email ${user.email} can't create file for ${targetUser.email}`);
        }

        let parentFile: File | null = null;
        if (dto.parent !== null && dto.parent !== undefined) {
            parentFile = await this.fileRepository.findOne({where: {id: dto.parent}});
            if (!parentFile) throw new Error(`Parent file with id ${dto.parent} not found`);

        }

        const savedFile = await this.saveFileTree(dto, user, parentFile, targetUser);

        return this.mapFileToDto(savedFile, loggedInUser.email);
    }

    async changeLikes(dto: ChangeFileLikesDto): Promise<FileDto> {
        const file = await this.fileRepository.findOne({where: {id: dto.id}});
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

        const savedFile = await this.fileRepository.save(file);

        const isLiked = savedFile.likedEmails.includes(dto.email);

        return {
            id: file.id,
            type: file.type,
            name: file.name,
            content: file.content,
            status: file.status,
            likes: file.likes,
            lastEditor: file.lastEditor,
            author: file.author,
            parent: file.parent ? file.parent.id : null,
            children: [],
            isLiked
        };
    }

    async changeName(dto: RenameFileDto): Promise<File> {
        const file = await this.fileRepository.findOne({where: {id: dto.id}});
        if (!file) {
            throw new Error(`File with id ${dto.id} not found`);
        }

        file.name = dto.name;

        return await this.fileRepository.save(file);
    }

    async changeContent(dto: ChangeFileContentDto): Promise<File> {
        const file = await this.fileRepository.findOne({where: {id: dto.id}});
        if (!file) {
            throw new Error(`File with id ${dto.id} not found`);
        }

        file.content = dto.content;
        file.lastEditor = dto.editor;

        return await this.fileRepository.save(file);
    }

    async deleteFileTree(dto: DeleteFileDto): Promise<number> {
        const {id, email} = dto;
        const treeRepository = this.fileRepository.manager.getTreeRepository(File);

        const root = await this.fileRepository.findOne({where: {id}});
        if (!root) {
            throw new Error(`File with id ${id} not found`);
        }

        const tree = await treeRepository.findDescendantsTree(root);

        const extractImagePaths = (content: string): string[] => {
            const imageRegex = /\[image\/(.+?)]/g;
            const imagePaths: string[] = [];
            let match: string[] | null;

            while ((match = imageRegex.exec(content)) !== null) {
                imagePaths.push(match[1].split(':')[1]);
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
            .where('file.id IN (:...ids)', {ids: idsToRemove})
            .andWhere('file.type = :fileType', {fileType: 'File'})
            .getMany();

        const filesCount = filesOnly.length;

        try {
            await this.imagesService.deleteImgbbImages(Array.from(allImageNames));
        } catch (error) {
            console.warn(error.message);
        }

        await this.fileRepository.delete(idsToRemove);

        if (filesCount > 0) {
            await this.userService.deleteAmountOfFiles(email, filesCount);
        }

        return id;
    }

    mapFileToDto(file: File, loggedInUserEmail?: string): FileDto {
        return {
            id: file.id,
            type: file.type,
            name: file.name,
            content: file.content,
            status: file.status,
            likes: file.likes || 0,
            isLiked: file.likedEmails?.includes(loggedInUserEmail || '') || false,
            lastEditor: file.lastEditor,
            author: file.author,
            children: file.children?.map(child => this.mapFileToDto(child, loggedInUserEmail)) || [],
            parent: file.parent ? file.parent.id : null,
        };
    }
}