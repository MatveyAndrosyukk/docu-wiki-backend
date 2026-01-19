import {IsNumber, IsString} from "@nestjs/class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class ChangeFileContentDto{
    @ApiProperty({ example: '1', description: `The id of file, where you need to change content`})
    @IsNumber({}, {message: 'ID should be a number'})
    id: number;
    @ApiProperty({ example: 'Some string', description: `A new content of the file`})
    @IsString({message: 'Content should be a string'})
    content: string;
    @ApiProperty({ example: 'admin@gmail.com', description: `The file last editor`})
    @IsString({message: 'Content should be a string'})
    editor: string;
}