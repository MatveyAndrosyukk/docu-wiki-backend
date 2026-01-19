import {IsNumber, IsString} from "@nestjs/class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class DeleteFileDto{
    @ApiProperty({ example: '1', description: `The id of file, where you need to change content`})
    @IsNumber({}, {message: 'ID should be a number'})
    id: number;
    @ApiProperty({ example: 'admin@gmail.com', description: `User who keeps files`})
    @IsString({message: 'Name should be a string'})
    email: string;
}