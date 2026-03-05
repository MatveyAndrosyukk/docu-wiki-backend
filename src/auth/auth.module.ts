import {forwardRef, Module} from '@nestjs/common';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';
import {UsersModule} from "../users/users.module";
import {JwtModule} from "@nestjs/jwt";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {EmailModule} from "../email/email.module";
import {JwtStrategy} from "./jwt.strategy";

@Module({
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    imports: [
        forwardRef(() => UsersModule),
        ConfigModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET  || 'SUPER_SECRET',
            signOptions: { expiresIn: '24h' },
        }),
        EmailModule
    ],
    exports: [AuthService, JwtModule]
})
export class AuthModule {}
