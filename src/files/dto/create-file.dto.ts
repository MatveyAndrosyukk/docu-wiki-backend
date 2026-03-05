import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsString, IsNumber, IsOptional } from '@nestjs/class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FileType } from '../types/file-type';
import {IsNotEmpty} from "class-validator";

export class CreateFileDto {
    @ApiProperty({ example: 'Folder', description: `Type of saved file, can be 'File' or 'Folder'` })
    @IsEnum(FileType, { message: `File type can be only 'Folder' or 'File'` })
    type: string;

    @ApiProperty({ example: 'JS documentation', description: `The name of saved file` })
    @IsString({ message: 'Name should be a string' })
    name: string;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    likes: number | null;

    @ApiProperty({ example: 'Some string of a code block', description: `The content of saved file` })
    @IsOptional()
    content: string | null;

    @ApiProperty({ example: '1', description: `The id of the folder, where file will be saved`, required: false })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    parent: number | null;

    @IsOptional()
    children: CreateFileDto[];

    @IsEmail()
    @IsNotEmpty()
    targetUserEmail: string;
}