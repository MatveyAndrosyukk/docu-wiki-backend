import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {File} from "./files.model";
import {UsersModule} from "../users/users.module";
import {AuthModule} from "../auth/auth.module";
import {ImagesModule} from "../images/images.module";

@Module({
  imports: [
      TypeOrmModule.forFeature([File]),
      UsersModule,
      AuthModule,
      ImagesModule
  ],
  providers: [FilesService],
  controllers: [FilesController]
})
export class FilesModule {}
