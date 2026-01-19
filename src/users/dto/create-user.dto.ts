import {IsEmail, MinLength} from "@nestjs/class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class CreateUserDto {
    @ApiProperty({example: 'user@gmail.com', description: `User's email address`})
    @IsEmail({}, {message: 'Incorrect email address'})
    email: string;

    @ApiProperty({example: '12345678user', description: `User's password`})
    @MinLength(6, {message: 'Password must be at least 6 characters long'})
    password: string;

    @ApiProperty({example: 'User Name', description: `User's name`, required: false})
    name?: string;
}