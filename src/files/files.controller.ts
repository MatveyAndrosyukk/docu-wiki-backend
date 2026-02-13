import {Body, Controller, Delete, Get, HttpException, HttpStatus, Post, Put, Query} from '@nestjs/common';
import {FilesService} from "./files.service";
import {CreateFileDto} from "./dto/create-file.dto";
import {ChangeFileLikesDto} from "./dto/change-file-likes.dto";
import {RenameFileDto} from "./dto/rename-file.dto";
import {File} from "./files.model";
import {ChangeFileContentDto} from "./dto/change-file-content.dto";
import {DeleteFileDto} from "./dto/delete-file.dto";
import {GetFilesForUserDto} from "./dto/get-file-for-user.dto";
import {FileDto} from "./types/file-dto";

@Controller('files')
export class FilesController {
    constructor(private readonly fileService: FilesService) {
    }

    @Get()
    async getFilesForUser(
        @Query('viewedUserEmail') viewedUserEmail: string,
        @Query('loggedInUserEmail') loggedInUserEmail?: string
    ): Promise<FileDto[]> {
        if (!viewedUserEmail) {
            throw new HttpException('Email query parameter is required', HttpStatus.BAD_REQUEST);
        }

        const dto: GetFilesForUserDto = {
            viewedUserEmail,
            loggedInUserEmail: loggedInUserEmail || ""
        };

        return await this.fileService.getAllForUser(dto);
    }

    @Get('isLiked')
    async checkIfUserLikedFile(
        @Query('id') id: number,
        @Query('email') email: string
    ): Promise<boolean> {
        if (!email) {
            throw new HttpException('Email query parameter is required', HttpStatus.BAD_REQUEST);
        }
        if (!id) {
            throw new HttpException('ID query parameter is required', HttpStatus.BAD_REQUEST);
        }
        try {
            return await this.fileService.checkIfUserLikedFile(id, email);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'File not found',
                HttpStatus.NOT_FOUND
            );
        }
    }

    @Post()
    async saveFileForUser(@Body() dto: CreateFileDto): Promise<FileDto> {
        try {
            console.log(dto);
            return await this.fileService.saveFileTreeForUser(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to save file',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Delete()
    async deleteFileById(@Body() dto: DeleteFileDto): Promise<number> {
        try {
            return await this.fileService.deleteFileTree(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to delete file',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Put('like')
    async changeLikes(@Body() dto: ChangeFileLikesDto): Promise<FileDto> {
        try {
            return await this.fileService.changeLikes(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to update likes',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Put('rename')
    async changeName(@Body() dto: RenameFileDto): Promise<File> {
        try {
            return await this.fileService.changeName(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to rename file',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Put('content')
    async changeContent(@Body() dto: ChangeFileContentDto): Promise<File> {
        try {
            return await this.fileService.changeContent(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to update content',
                HttpStatus.BAD_REQUEST
            );
        }
    }
}