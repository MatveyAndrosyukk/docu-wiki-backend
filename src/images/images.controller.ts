import {Body, Controller, HttpException, HttpStatus, Post, UploadedFile, UseInterceptors} from '@nestjs/common';
import {Express} from 'express';
import {FileInterceptor} from "@nestjs/platform-express";
import {ImagesService} from "./images.service";
import {convertUrlsToResponse} from "./images.utils";

@Controller('images')
export class ImagesController {
    constructor(private readonly imageService: ImagesService) {
    }

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            limits: {fileSize: 32 * 1024 * 1024},
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

    // @Get(':name')
    // async getImage(@Param('name') name: string, @Res() res: Response) {
    //     try {
    //         const filePath = await this.imageService.getImagePathByName(name);
    //         res.sendFile(path.resolve(filePath));
    //     } catch (error) {
    //         throw new HttpException(
    //             error instanceof Error ? error.message : 'Image not found',
    //             HttpStatus.NOT_FOUND
    //         );
    //     }
    // }

    // @Delete()
    // async deleteImages(@Body() body: { extraImages: string[] }) {
    //     const {extraImages} = body;
    //
    //     if (!extraImages || extraImages.length === 0 || !Array.isArray(extraImages)) {
    //         throw new HttpException('Extra images must be a non-empty array', HttpStatus.BAD_REQUEST);
    //     }
    //
    //     try {
    //         const deletedCount = await this.imageService.deleteImages(extraImages);
    //         return {
    //             deleted: deletedCount,
    //             message: `Successfully deleted ${deletedCount} image(s)`,
    //         };
    //     } catch (error) {
    //         throw new HttpException(
    //             error instanceof Error ? error.message : 'Failed to delete images',
    //             HttpStatus.INTERNAL_SERVER_ERROR
    //         );
    //     }
    // }
}