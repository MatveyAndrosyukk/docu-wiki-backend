import {IsEmail, IsNumber} from "@nestjs/class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class ChangeFileLikesDto{
    @ApiProperty({ example: '1', description: `The id of file, where you need to change likes`})
    @IsNumber({}, {message: 'ID should be a number'})
    id: number;
    @ApiProperty({ example: 'owner@gmail.com', description: `An email of user who liked the file`})
    @IsEmail({}, {message: 'Email address should be a valid email'})
    email: string;
}