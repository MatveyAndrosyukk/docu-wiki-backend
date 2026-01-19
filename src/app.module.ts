import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import * as process from "node:process";
import {ConfigModule} from "@nestjs/config";
import {UsersModule} from './users/users.module';
import {User} from "./users/users.model";
import {RolesModule} from './roles/roles.module';
import {Role} from "./roles/roles.model";
import {DataSeederService} from "./services/data-seeder.service";
import {FilesModule} from './files/files.module';
import {File} from "./files/files.model";
import {AuthModule} from './auth/auth.module';
import {ImagesModule} from './images/images.module';
import {CacheModule} from "@nestjs/cache-manager";

@Module({
    imports: [
        CacheModule.register({
            ttl: 300,
            max: 100,
            isGlobal: true,
        }),
        ConfigModule.forRoot({
            envFilePath: `.${process.env.NODE_ENV}.env`,
        }),
        TypeOrmModule.forRoot({
            type: 'mysql',
            host: process.env.MYSQL_HOST,
            port: Number(process.env.MYSQL_PORT),
            username: process.env.MYSQL_USERNAME,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE,
            entities: [User, Role],
            autoLoadEntities: true,
            synchronize: true,
        }),
        TypeOrmModule.forFeature([User, Role, File]),
        UsersModule,
        RolesModule,
        FilesModule,
        AuthModule,
        ImagesModule,
    ],
    controllers: [],
    providers: [DataSeederService],
})
export class AppModule {
}
