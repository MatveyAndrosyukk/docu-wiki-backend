import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Res,
    UploadedFile,
    UseInterceptors
} from '@nestjs/common';
import {Response} from 'express';
import {FileInterceptor} from "@nestjs/platform-express";
import {diskStorage} from "multer";
import * as path from "node:path";
import {ImagesService} from "./images.service";
import {Express} from 'express';

@Controller('images')
export class ImagesController {
    constructor(private readonly imageService: ImagesService) {
    }

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './static',
                filename: (_req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    const ext = path.extname(file.originalname);
                    const filename = `${uniqueSuffix}${ext}`;
                    cb(null, filename);
                },
            }),
            limits: {fileSize: 5 * 1024 * 1024},
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
            const fileName = await this.imageService.saveImage(file);
            return {fileName};
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to save image',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(':name')
    async getImage(@Param('name') name: string, @Res() res: Response) {
        try {
            const filePath = await this.imageService.getImagePathByName(name);
            res.sendFile(path.resolve(filePath));
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Image not found',
                HttpStatus.NOT_FOUND
            );
        }
    }

    @Delete()
    async deleteImages(@Body() body: { extraImages: string[] }) {
        const {extraImages} = body;

        if (!extraImages || extraImages.length === 0 || !Array.isArray(extraImages)) {
            throw new HttpException('Extra images must be a non-empty array', HttpStatus.BAD_REQUEST);
        }

        try {
            const deletedCount = await this.imageService.deleteImages(extraImages);
            return {
                deleted: deletedCount,
                message: `Successfully deleted ${deletedCount} image(s)`,
            };
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to delete images',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}