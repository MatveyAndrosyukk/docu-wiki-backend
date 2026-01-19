import {Column, Entity, ManyToMany, PrimaryGeneratedColumn} from "typeorm";
import {User} from "../users/users.model";

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', nullable: false, unique: true})
    value:string;

    @Column({type: 'varchar', nullable: false, unique: false})
    description:string;

    @ManyToMany(() => User, user => user.roles)
    users: User[];
}