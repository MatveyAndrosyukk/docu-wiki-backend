import {Module} from '@nestjs/common';
import {ImagesService} from './images.service';
import {ImagesController} from './images.controller';
import {JwtModule} from "@nestjs/jwt";
import {BullModule} from "@nestjs/bull";
import {DeleteImagesProcessor} from "./delete-images.processor";
import { HttpModule } from '@nestjs/axios';

@Module({
    providers: [ImagesService, DeleteImagesProcessor],
    controllers: [ImagesController],
    imports: [
        HttpModule,
        JwtModule,
        BullModule.registerQueue({
            name: 'delete-images',
            defaultJobOptions: {
                removeOnComplete: 10,
                removeOnFail: 5,
            },
        }),],
    exports: [ImagesService],
})
export class ImagesModule {
}
