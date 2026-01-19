import {Injectable} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import {InjectQueue} from '@nestjs/bull';
import {Express} from 'express';
import {Queue} from "bullmq";

@Injectable()
export class ImagesService {
    private readonly uploadPath = path.resolve(__dirname, '../../static');

    constructor(
        @InjectQueue('delete-images')
        private deleteImagesQueue: Queue,
    ) {
    }

    async saveImage(file: Express.Multer.File): Promise<string> {
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, {recursive: true});
        }
        return file.filename;
    }

    async getImagePathByName(name: string): Promise<string> {
        const filePath = path.join(this.uploadPath, name);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Image ${name} not found`);
        }
        return filePath;
    }

    async deleteImages(extraImages: string[]): Promise<number> {
        let queuedCount = 0;

        for (const image of extraImages) {
            try {
                const imagePath = await this.getImagePathByName(image);
                require('fs').unlinkSync(imagePath);
            } catch (error) {
                console.warn(`Image ${image} not found or already deleted`);
            }
        }

        return queuedCount;
    }
}