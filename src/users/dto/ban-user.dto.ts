import {IsEmail, IsString} from "@nestjs/class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class BanUserDto {
    @ApiProperty({example: 'user@gmail.com', description: `User's email address`})
    @IsEmail({}, {message: 'Incorrect email address'})
    email: string;
    @ApiProperty({example: 'Spammer', description: `The reason why user was banned`})
    @IsString({message: 'Ban reason should be a string'})
    banReason: string;
}