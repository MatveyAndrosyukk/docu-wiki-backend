import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Query,
    UseGuards
} from '@nestjs/common';
import {CreateUserDto} from "./dto/create-user.dto";
import {User} from "./users.model";
import {UsersService} from "./users.service";
import {BanUserDto} from "./dto/ban-user.dto";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RolesGuard} from "../auth/roles-auth.guard";
import {Roles} from "../auth/roles-auth.decorator";
import {ChangeWhoCanEditUserDto} from "./dto/change-whoCanEdit-user.dto";
import {ChangeNameUserDto} from "./dto/change-name-user.dto";

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {
    }

    @Get('findOne')
    async findUser(@Query('id') id?: string, @Query('email') email?: string): Promise<User | null> {
        if (id) {
            return await this.usersService.findById(Number(id));
        }
        if (email) {
            return await this.usersService.findByEmail(email);
        }
        return null;
    }

    @Get()
    @Roles('OWNER', 'ADMIN')
    @UseGuards(JwtAuthGuard, RolesGuard)
    async findUsers(): Promise<User[]> {
        return await this.usersService.findAll();
    }

    @Post()
    async saveUser(@Body() dto: CreateUserDto): Promise<User> {
        try {
            return await this.usersService.save(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Registration failed',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Post('whoCanEdit')
    async addUserWhoCanEdit(@Body() dto: ChangeWhoCanEditUserDto): Promise<User> {
        try {
            return await this.usersService.addUserWhoCanEdit(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to add editor',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Post('name')
    async changeUserName(@Body() dto: ChangeNameUserDto): Promise<User> {
        try {
            return await this.usersService.changeName(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to change name',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Post('isViewBlocked')
    async changeUserIsViewBlocked(@Query('email') email: string): Promise<User> {
        try {
            return await this.usersService.blockView(email);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to toggle view block',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Delete('whoCanEdit')
    async deleteUserWhoCanEdit(@Body() dto: ChangeWhoCanEditUserDto): Promise<User> {
        try {
            return await this.usersService.deleteUserWhoCanEdit(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to remove editor',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Post('ban')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('OWNER', 'ADMIN')
    async banUserByEmail(@Body() dto: BanUserDto): Promise<User> {
        try {
            return await this.usersService.banByEmail(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to ban user',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Post('unban')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('OWNER', 'ADMIN')
    async unbanUserByEmail(@Body() body: { email: string }): Promise<User> {
        try {
            const {email} = body;
            return await this.usersService.unbanByEmail(email);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to unban user',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteUser(@Param('id') id: string): Promise<void> {
        try {
            await this.usersService.delete(Number(id));
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to delete user',
                HttpStatus.NOT_FOUND
            );
        }
    }
}