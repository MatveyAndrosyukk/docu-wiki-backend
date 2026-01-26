import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import * as path from 'path';
import {Express} from 'express';
import {HttpService} from '@nestjs/axios';
import {firstValueFrom} from 'rxjs';
import * as process from "node:process";
import {DeleteImgbbImagesMethodResponse, ImgbbUploadSuccessResponse, UploadToImgbbMethodResponse} from "./images.types";
import FormData = require('form-data');

@Injectable()
export class ImagesService {
    private readonly imgbbApiKey = process.env.IMGBB_API_KEY;

    constructor(
        private readonly httpService: HttpService,
    ) {
    }

    async uploadToImgbb(file: Express.Multer.File): Promise<UploadToImgbbMethodResponse> {
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        const uniqueFilename = `${timestamp}-${randomSuffix}${ext}`

        const form = new FormData();
        form.append('key', this.imgbbApiKey);
        form.append('image', file.buffer, {
            filename: uniqueFilename,
            contentType: file.mimetype,
            knownLength: file.buffer.length,
        });

        try {
            const response = await firstValueFrom(
                this.httpService.post<ImgbbUploadSuccessResponse>('https://api.imgbb.com/1/upload', form, {
                    headers: form.getHeaders(),
                }),
            );

            const data: any = response.data;
            if (data.status === 200) {
                return {
                    url: data.data.url,
                    delete_url: data.data.delete_url,
                    filename: uniqueFilename,
                    originalName: file.originalname,
                };
            } else {
                throw new Error(data.error?.message || 'Upload failed');
            }
        } catch (error: any) {
            throw new HttpException(
                'imgBB upload error: ' + (error.response?.data?.error?.message || error.message),
                HttpStatus.BAD_REQUEST
            );
        }
    }

    async deleteImgbbImages(deleteUrls: string[]): Promise<DeleteImgbbImagesMethodResponse> {
        for (const deleteUrl of deleteUrls) {
            const urlMatch = deleteUrl.match(/([a-zA-Z0-9]+)\/([a-z0-9]+)/);
            if (!urlMatch) {
                throw new HttpException('Invalid delete url address', HttpStatus.BAD_REQUEST);
            }

            const [imageId, imageHash] = deleteUrl.split('/');

            const form = new FormData();
            form.append('pathname', `/${imageId}/${imageHash}`);
            form.append('action', 'delete');
            form.append('delete', 'image');
            form.append('from', 'resource');
            form.append('deleting[id]', imageId);
            form.append('deleting[hash]', imageHash);

            try {
                const response = await firstValueFrom(
                    this.httpService.post('https://ibb.co/json', form, {
                        headers: form.getHeaders(),
                    }),
                );

                const data: any = response.data;
                if (!(data.success || response.status === 200)) {
                    throw new Error(data.error?.message || `Failed to delete file ${imageId}`);
                }
            } catch (error: any) {
                throw new HttpException(
                    'imgBB delete error: ' + (error.response?.data?.error?.message || error.message),
                    HttpStatus.BAD_REQUEST
                );
            }
        }
        return {success: true, message: 'Images were deleted successfully.'};
    }

    // async saveImage(file: Express.Multer.File): Promise<string> {
    //     if (!fs.existsSync(this.uploadPath)) {
    //         fs.mkdirSync(this.uploadPath, {recursive: true});
    //     }
    //     return file.filename;
    // }

    // async getImagePathByName(name: string): Promise<string> {
    //     const filePath = path.join(this.uploadPath, name);
    //     if (!fs.existsSync(filePath)) {
    //         throw new Error(`Image ${name} not found`);
    //     }
    //     return filePath;
    // }
    //
    // async deleteImages(extraImages: string[]): Promise<number> {
    //     let deletedCount = 0;
    //     for (const image of extraImages) {
    //         try {
    //             const imagePath = await this.getImagePathByName(image);
    //             fs.unlinkSync(imagePath);
    //             deletedCount++;
    //         } catch {
    //         }
    //     }
    //     return deletedCount;
    // }
}