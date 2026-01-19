import {IsEmail} from "@nestjs/class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class ChangeWhoCanEditUserDto {
    @ApiProperty({example: 'user@gmail.com', description: `User's email address`})
    @IsEmail({}, {message: 'Incorrect email address'})
    userEmail: string;
    @ApiProperty({example: 'user@gmail.com', description: `Target user's email address`})
    @IsEmail({}, {message: 'Incorrect email address'})
    whoCanEditEmail: string;
}