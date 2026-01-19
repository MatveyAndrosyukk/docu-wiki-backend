import {Repository} from "typeorm";
import {User} from "./users.model";
import {InjectRepository} from "@nestjs/typeorm";
import {CreateUserDto} from "./dto/create-user.dto";
import {BanUserDto} from "./dto/ban-user.dto";
import {RolesService} from "../roles/roles.service";
import {ChangeWhoCanEditUserDto} from "./dto/change-whoCanEdit-user.dto";
import {ChangeNameUserDto} from "./dto/change-name-user.dto";
import { Injectable, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import {CACHE_MANAGER} from "@nestjs/cache-manager";

@Injectable()
export class UsersService {
    private readonly cacheKeyPrefix = 'user:email:';
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private rolesService: RolesService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
    }

    async findById(id: number): Promise<User | null> {
        return await this.usersRepository.findOne({where: {id}, relations: ['roles']});
    }

    async findAll(): Promise<User[]> {
        return await this.usersRepository.find({relations: ['roles']});
    }

    async findByEmail(email: string): Promise<User | null> {
        const cacheKey = `${this.cacheKeyPrefix}${email}`;
        let user = await this.cacheManager.get<User | null>(cacheKey);

        if (user !== null && user !== undefined) {
            return user;
        }

        user = await this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'role')
            .leftJoinAndSelect('user.whoCanEdit', 'editor')
            .select([
                'user.id', 'user.email', 'user.name', 'user.password', 'user.banned',
                'user.banReason', 'user.isPremium', 'user.amountOfFiles',
                'user.bannedAt', 'user.isViewBlocked', 'user.isConfirmed',
                'role.id', 'role.value',
                'editor.id', 'editor.email', 'editor.name'
            ])
            .where('user.email = :email', { email })
            .getOne();

        if (user) {
            await this.cacheManager.set(cacheKey, user, 300);
        }

        return user;
    }

    async findByName(name: string): Promise<User | null> {
        return await this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.roles', 'role')
            .leftJoinAndSelect('user.whoCanEdit', 'editor')
            .select([
                'user.id',
                'user.email',
                'user.name',
                'user.password',
                'user.banned',
                'user.banReason',
                'user.isPremium',
                'user.amountOfFiles',
                'user.bannedAt',
                'user.isViewBlocked',
                'user.isConfirmed',
                'role.id',
                'role.value',
                'editor.id',
                'editor.email',
                'editor.name'
            ])
            .where('user.name = :name', {name})
            .getOne();
    }

    async save(dto: CreateUserDto): Promise<User> {
        const email = dto.email;
        const existingUser = await this.usersRepository.findOne({where: {email}});

        if (existingUser) {
            throw new Error(`User with email ${email} already exists`);
        }

        const user = this.usersRepository.create(dto);

        if (!user.name) {
            user.name = await this.generateUniqueUsername();
        }

        user.roles = [];

        try {
            const defaultRole = await this.rolesService.findByValue('USER');
            if (defaultRole) {
                user.roles.push(defaultRole);
            }
        } catch (error) {
            console.warn('Default USER role not found');
        }

        await this.invalidateEmailCache(email);

        return await this.usersRepository.save(user);
    }

    async addUserWhoCanEdit(dto: ChangeWhoCanEditUserDto): Promise<User> {
        const user = await this.findByEmail(dto.userEmail);
        if (!user) {
            throw new Error(`User with email ${dto.userEmail} does not exist`);
        }

        const userWhoCanEdit = await this.findByEmail(dto.whoCanEditEmail);
        if (!userWhoCanEdit) {
            throw new Error(`User with email ${dto.whoCanEditEmail} does not exist`);
        }

        if (dto.whoCanEditEmail === dto.userEmail) {
            throw new Error("You can't add yourself to your editors");
        }

        const alreadyEditor = user.whoCanEdit.some(editor => editor.email === dto.whoCanEditEmail);
        if (alreadyEditor) {
            throw new Error("This user is already in your editors list");
        }

        user.whoCanEdit.push(userWhoCanEdit);

        await this.invalidateEmailCache(user.email);

        return await this.usersRepository.save(user);
    }

    async banByEmail(dto: BanUserDto): Promise<User> {
        const email = dto.email;
        const user = await this.usersRepository.findOne({where: {email}});
        if (!user) {
            throw new Error(`User with email ${email} does not exist`);
        }
        user.banned = true;
        user.bannedAt = new Date();
        user.banReason = dto.banReason;

        await this.invalidateEmailCache(email);

        return await this.usersRepository.save(user);
    }

    async unbanByEmail(email: string): Promise<User> {
        const user = await this.usersRepository.findOne({where: {email}});
        if (!user) {
            throw new Error(`User with email ${email} does not exist`);
        }
        user.banned = false;

        await this.invalidateEmailCache(email);

        return await this.usersRepository.save(user);
    }

    async changeName(dto: ChangeNameUserDto): Promise<User> {
        const user = await this.findByEmail(dto.email);
        if (!user) {
            throw new Error(`User with email ${dto.email} does not exist`);
        }

        const existingUser = await this.findByName(dto.name);
        if (existingUser) {
            throw new Error(`User with name ${dto.name} already exists`);
        }

        user.name = dto.name;

        await this.invalidateEmailCache(user.email);

        return await this.usersRepository.save(user);
    }

    async blockView(email: string): Promise<User> {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new Error(`User with email ${email} does not exist`);
        }

        user.isViewBlocked = !user.isViewBlocked;

        await this.invalidateEmailCache(user.email);

        return await this.usersRepository.save(user);
    }

    async delete(id: number): Promise<string> {
        const user = await this.usersRepository.findOne({where: {id}});
        if (!user) {
            throw new Error(`User with id ${id} not found`);
        }

        user.roles = [];
        await this.usersRepository.save(user);
        await this.usersRepository.delete(id);

        await this.invalidateEmailCache(user.email);

        return `User with id ${id} successfully deleted`;
    }

    async deleteUserWhoCanEdit(dto: ChangeWhoCanEditUserDto): Promise<User> {
        const user = await this.findByEmail(dto.userEmail);
        if (!user) {
            throw new Error(`User with email ${dto.userEmail} does not exist`);
        }

        const userWhoCanEdit = await this.findByEmail(dto.whoCanEditEmail);
        if (!userWhoCanEdit) {
            throw new Error(`User with email ${dto.whoCanEditEmail} does not exist`);
        }

        user.whoCanEdit = user.whoCanEdit.filter(editor => editor.id !== userWhoCanEdit.id);

        await this.invalidateEmailCache(user.email);

        return await this.usersRepository.save(user);
    }

    async updatePassword(userId: number, newPassword: string): Promise<User> {
        const user = await this.usersRepository.findOne({where: {id: userId}});
        if (!user) {
            throw new Error('User not found');
        }
        user.password = newPassword;

        await this.invalidateEmailCache(user.email);

        return await this.usersRepository.save(user);
    }

    async generateUniqueUsername(): Promise<string> {
        let username: string;
        let isUnique = false;
        do {
            username = 'user' + Math.floor(Math.random() * 10000000);
            const existing = await this.usersRepository.findOne({where: {name: username}});
            if (!existing) {
                isUnique = true;
            }
        } while (!isUnique);
        return username;
    }

    async changeAmountOfFiles(email: string, flag: number): Promise<void> {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new Error(`User with email ${email} does not exist`);
        }

        user.amountOfFiles = user.amountOfFiles + (flag ? 1 : -1);

        await this.invalidateEmailCache(email);

        await this.usersRepository.save(user);
    }

    async deleteAmountOfFiles(email: string, amount: number): Promise<void> {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new Error(`User with email ${email} does not exist`);
        }

        user.amountOfFiles = Math.max(0, user.amountOfFiles - amount);

        await this.invalidateEmailCache(email);

        await this.usersRepository.save(user);
    }

    private async invalidateEmailCache(email: string): Promise<void> {
        const cacheKey = `${this.cacheKeyPrefix}${email}`;
        await this.cacheManager.del(cacheKey);
    }
}