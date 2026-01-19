import {Injectable, OnApplicationBootstrap} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Role} from "../roles/roles.model";
import {Repository} from "typeorm";
import {User} from "../users/users.model";
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DataSeederService implements OnApplicationBootstrap{
    constructor(
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
    }
    async onApplicationBootstrap() {
        const rolesToSeed = [
            {value: 'OWNER', description: 'The owner of the site'},
            {value: 'ADMIN', description: 'Administrator of DocuWiki'},
            {value: 'USER', description: 'Common user of DocuWiki'},
        ];
        const usersToSeed = [
            {email: 'owner@gmail.com', password: 'owner123'},
            {email: 'admin@gmail.com', password: 'admin123'},
            {email: 'user@gmail.com', password: 'user123'},
        ];

        for (const role of rolesToSeed) {
            const existingRole = await this.roleRepository.findOne(
                { where: { value: role.value } }
            );
            if (!existingRole) {
                const seedRole = this.roleRepository.create(role);
                await this.roleRepository.save(seedRole);
            }
        }

        for (const user of usersToSeed) {
            const existingUser = await this.userRepository.findOne(
                {where: { email: user.email } }
            )
            if (!existingUser && user.email === 'owner@gmail.com') {
                const seedUser = this.userRepository.create(user);

                let seedUserRoles:Role[] = [];
                const ownerRole = await this.roleRepository.findOne({where: {value: 'OWNER'}});
                const adminRole = await this.roleRepository.findOne({where: {value: 'ADMIN'}});
                const userRole = await this.roleRepository.findOne({where: {value: 'USER'}})

                if (ownerRole && adminRole && userRole) {
                    seedUserRoles.push(ownerRole);
                    seedUserRoles.push(adminRole);
                    seedUserRoles.push(userRole);
                }
                seedUser.roles = seedUserRoles;
                seedUser.isConfirmed = true;
                seedUser.name = 'owner';
                seedUser.isPremium = true;
                await this.userRepository.save({...seedUser,
                    name: seedUser.email,
                    password: bcrypt.hashSync(seedUser.password, 10)});
            }

            if (!existingUser && user.email === 'admin@gmail.com') {
                const seedUser = this.userRepository.create(user);

                let seedUserRoles:Role[] = [];
                const adminRole = await this.roleRepository.findOne({where: {value: 'ADMIN'}});
                const userRole = await this.roleRepository.findOne({where: {value: 'USER'}})

                if (adminRole && userRole) {
                    seedUserRoles.push(adminRole);
                    seedUserRoles.push(userRole);
                }
                seedUser.roles = seedUserRoles;
                seedUser.isConfirmed = true;
                seedUser.name = 'admin';
                seedUser.isPremium = true;
                await this.userRepository.save({...seedUser,
                    name: seedUser.email,
                    password: bcrypt.hashSync(seedUser.password, 10)});
            }

            if (!existingUser && user.email === 'user@gmail.com') {
                const seedUser = this.userRepository.create(user);

                let seedUserRoles:Role[] = [];
                const userRole = await this.roleRepository.findOne({where: {value: 'USER'}})

                if (userRole) {
                    seedUserRoles.push(userRole);
                }
                seedUser.roles = seedUserRoles;
                seedUser.isConfirmed = true;
                seedUser.name = 'user';
                await this.userRepository.save({...seedUser,
                    name: seedUser.email,
                    password: bcrypt.hashSync(seedUser.password, 10)});
            }
        }
    }
}