import {IsString} from "@nestjs/class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class CreateRoleDto {
    @ApiProperty({ example: 'USER', description: `The name of the role` })
    @IsString({message: 'Role value should be a string'})
    value: string;
    @ApiProperty({ example: 'Common user of DocuWiki', description: `Simple description of the role` })
    @IsString({message: 'Role description should be a string'})
    description: string;
}