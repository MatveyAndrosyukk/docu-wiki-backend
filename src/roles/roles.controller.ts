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
import {RolesService} from "./roles.service";
import {Role} from "./roles.model";
import {CreateRoleDto} from "./dto/create-role.dto";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {RolesGuard} from "../auth/roles-auth.guard";

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) {
    }

    @Get()
    async findRole(@Query('value') value?: string, @Query('id') id?: number): Promise<Role | Role[]> {
        try {
            if (value) {
                return await this.rolesService.findByValue(value);
            }
            if (id) {
                return await this.rolesService.findById(id);
            }
            return await this.rolesService.findAll();
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Role not found',
                HttpStatus.NOT_FOUND
            );
        }
    }

    @Post()
    async saveRole(@Body() dto: CreateRoleDto): Promise<Role> {
        try {
            return await this.rolesService.save(dto);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to create role',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteRole(@Param('id') id: number): Promise<void> {
        try {
            await this.rolesService.delete(id);
        } catch (error) {
            throw new HttpException(
                error instanceof Error ? error.message : 'Failed to delete role',
                HttpStatus.NOT_FOUND
            );
        }
    }
}