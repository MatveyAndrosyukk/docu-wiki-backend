import {Column, Entity, ManyToOne, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent} from "typeorm";
import {User} from "../users/users.model";

@Entity('files')
@Tree('closure-table')
export class File {

    constructor() {
        this.likedEmails = [];
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', nullable: false, unique: false})
    type: string;

    @Column({type: 'varchar', nullable: false, unique: false})
    name: string;

    @Column({type: 'text', nullable: true, unique: false})
    content: string | null;

    @Column({type: 'varchar', nullable: false, unique: false})
    status: string;

    @Column({type: 'int', nullable: false, unique: false, default: 0})
    likes: number;

    @Column('simple-array')
    likedEmails: string[];

    @Column({type: 'varchar', nullable: false, unique: false})
    lastEditor: string;

    @ManyToOne(() => User, user => user.files, {nullable: false})
    author: User;

    @TreeChildren()
    children: File[];

    @TreeParent({
        onDelete: 'CASCADE',
    })
    parent: File | null;
}