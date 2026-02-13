import {IsOptional, IsString} from "@nestjs/class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class GetFilesForUserDto {
    @ApiProperty({example: 'user1@gmail.com', description: `Email of the user whose files you want to get`})
    @IsString({message: 'Email should be a string'})
    viewedUserEmail: string;
    @ApiProperty({
        example: '1',
        description: `Email of user who gets files`,
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsString({message: 'Email should be a string'})
    loggedInUserEmail: string;
}