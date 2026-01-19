import {BeforeInsert, Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {Role} from "../roles/roles.model";
import {File} from "../files/files.model";

@Entity({name: 'users'})
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', nullable: false, unique: true})
    email: string;

    @Column({type: 'varchar', nullable: false, unique: true})
    name: string;

    @Column({type: 'varchar', nullable: false, unique: false})
    password: string;

    @Column({type: 'boolean', nullable: false, unique: false, default: false})
    banned: boolean;

    @Column({type: 'varchar', nullable: true, unique: false})
    banReason: string;

    @Column({type: 'datetime', nullable: true, unique: false})
    bannedAt: Date;

    @Column({type: 'boolean', nullable: false, default: false})
    isViewBlocked: boolean;

    @Column({type: 'boolean', nullable: false, default: false})
    isConfirmed: boolean;

    @Column({type: 'boolean', nullable: false, default: false})
    isPremium: boolean;

    @Column({type: 'int', nullable: false, default: 0})
    amountOfFiles: number;

    @ManyToMany(() => Role, role => role.users)
    @JoinTable()
    roles: Role[]

    @OneToMany(() => File, file => file.author)
    files: File[]

    @ManyToMany(() => User)
    @JoinTable({
        name: 'user_who_can_edit',
        joinColumn: {
            name: 'userId',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'editorUserId',
            referencedColumnName: 'id'
        }
    })
    whoCanEdit: User[]

    @BeforeInsert()
    generateDefaultName() {
        if (!this.name || this.name.trim() === '') {
            this.name = 'User' + Math.floor(Math.random() * 1e8);
        }
    }
}