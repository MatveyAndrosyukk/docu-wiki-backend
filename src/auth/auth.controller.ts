import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { CreateUserDto } from "../users/dto/create-user.dto";
import { AuthService } from "./auth.service";
import { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Get('verify')
    async verify(@Query('token') token: string, @Res() res: Response) {
        try {
            await this.authService.verify(token);
            return res.status(HttpStatus.OK).json({ message: 'Email verified successfully' });
        } catch (error) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: error instanceof Error ? error.message : 'Invalid or expired token'
            });
        }
    }

    @Post('register')
    async register(@Body() dto: CreateUserDto) {
        try {
            return await this.authService.register(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Registration failed',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Post('login')
    async login(@Body() dto: CreateUserDto) {
        try {
            return await this.authService.login(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Login failed',
                HttpStatus.UNAUTHORIZED
            );
        }
    }

    @Post('google')
    async googleAuth(@Body('code') code: string) {
        if (!code) {
            throw new HttpException('Authorization code required', HttpStatus.BAD_REQUEST);
        }
        try {
            return await this.authService.googleLogin(code);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Google login failed',
                HttpStatus.UNAUTHORIZED
            );
        }
    }

    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        try {
            return await this.authService.forgotPassword(email);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Password reset failed',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Post('reset-password')
    async resetPassword(@Body() body: { token: string; newPassword: string }) {
        try {
            return await this.authService.resetPassword(body.token, body.newPassword);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Password reset failed',
                HttpStatus.BAD_REQUEST
            );
        }
    }
}