import { Process, Processor } from '@nestjs/bull';
import * as fs from 'fs/promises';

@Processor('delete-images')
export class DeleteImagesProcessor {

    @Process('delete-image')
    async deleteImage(job: any) {
        const { filePath } = job.data;

        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error(`❌ Failed to delete ${filePath}:`, error.message);
            throw error;
        }
    }
}