import {Body, Controller, HttpException, HttpStatus, Post, UploadedFile, UseInterceptors} from '@nestjs/common';
import {Express} from 'express';
import {FileInterceptor} from "@nestjs/platform-express";
import {ImagesService} from "./images.service";
import {convertUrlsToResponse} from "./images.utils";
import {memoryStorage} from "multer";

@Controller('images')
export class ImagesController {
    constructor(private readonly imageService: ImagesService) {
    }

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {fileSize: 5 * 1024 * 1024},
            storage: memoryStorage(),
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.match(/image\//)) {
                    return cb(new HttpException('Only image files are allowed!', HttpStatus.BAD_REQUEST), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadImage(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
        }
        try {
            const result = await this.imageService.uploadToImgbb(file);
            return {
                fileName: convertUrlsToResponse(result),
            };

        } catch (error) {
            console.error(error)
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to save image',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('delete')
    async deleteImages(@Body('delete_urls') deleteUrls: string[]) {
        if (!deleteUrls) {
            throw new HttpException('delete_urls are required', HttpStatus.BAD_REQUEST);
        }
        try {

            return await this.imageService.deleteImgbbImages(deleteUrls);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to delete images',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}