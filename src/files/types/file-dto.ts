import {User} from "../../users/users.model";

export interface FileDto {
    id: number;
    type: string;
    name: string;
    content: string | null;
    status: string;
    likes: number;
    isLiked: boolean;
    lastEditor: string;
    author: User;
    children: FileDto[];
    parent: number | null;
}