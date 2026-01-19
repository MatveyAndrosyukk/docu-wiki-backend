import {IsNumber, IsString} from "@nestjs/class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class RenameFileDto{
    @ApiProperty({ example: '1', description: `The id of file, where you need to change content`})
    @IsNumber({}, {message: 'ID should be a number'})
    id: number;
    @ApiProperty({ example: '1', description: `A new name of the file`})
    @IsString({message: 'Name should be a string'})
    name: string;
}