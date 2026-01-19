import {forwardRef, Module} from '@nestjs/common';
import {UsersController} from './users.controller';
import {UsersService} from './users.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "./users.model";
import {AuthModule} from "../auth/auth.module";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RolesGuard} from "../auth/roles-auth.guard";
import {RolesModule} from "../roles/roles.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        forwardRef(() => AuthModule),
        forwardRef(() => RolesModule)
    ],
    controllers: [UsersController],
    providers: [UsersService, JwtAuthGuard, RolesGuard],
    exports: [UsersService, JwtAuthGuard, RolesGuard]
})
export class UsersModule {
}