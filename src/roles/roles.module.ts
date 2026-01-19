import {forwardRef, Module} from '@nestjs/common';
import {RolesController} from './roles.controller';
import {RolesService} from './roles.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Role} from "./roles.model";
import {AuthModule} from "../auth/auth.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Role]),
        forwardRef(() => AuthModule)
    ],
    controllers: [RolesController],
    providers: [RolesService],
    exports: [RolesService]
})
export class RolesModule {}