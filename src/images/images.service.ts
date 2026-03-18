import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Express} from 'express';
import {HttpService} from '@nestjs/axios';
import {firstValueFrom} from 'rxjs';
import * as process from "node:process";
import {DeleteImgbbImagesMethodResponse, ImgbbUploadSuccessResponse, UploadToImgbbMethodResponse} from "./images.types";
import * as sharp from "sharp";
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
        const uniqueFilename = `${timestamp}-${randomSuffix}.webp`

        const compressedBuffer = await sharp(file.buffer)
            .resize({
                width: 1600,
                withoutEnlargement: true
            })
            .webp({
                quality: 75
            })
            .toBuffer();

        const form = new FormData();

        form.append('key', this.imgbbApiKey);

        form.append('image', compressedBuffer, {
            filename: uniqueFilename,
            contentType: 'image/webp',
            knownLength: compressedBuffer.length
        });

        const response = await firstValueFrom(
            this.httpService.post<ImgbbUploadSuccessResponse>(
                'https://api.imgbb.com/1/upload',
                form,
                {headers: form.getHeaders()}
            )
        );

        const data: any = response.data;

        if (data.status === 200) {
            return {
                url: data.data.url,
                delete_url: data.data.delete_url,
                filename: uniqueFilename,
                originalName: file.originalname,
            };
        }

        throw new Error(data.error?.message || 'Upload failed');
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
}