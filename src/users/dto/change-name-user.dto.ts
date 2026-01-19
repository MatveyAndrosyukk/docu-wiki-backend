import {IsEmail, IsString} from "@nestjs/class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class ChangeNameUserDto {
    @ApiProperty({example: 'user@gmail.com', description: `User's email address`})
    @IsEmail({}, {message: 'Incorrect email address'})
    email: string;
    @ApiProperty({example: 'Matvey', description: `New name of user`})
    @IsString({message: 'Username should be a string'})
    name: string;
}