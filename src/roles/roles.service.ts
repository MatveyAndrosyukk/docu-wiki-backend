import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {Role} from "./roles.model";
import {Repository} from "typeorm";
import {CreateRoleDto} from "./dto/create-role.dto";

@Injectable()
export class RolesService {
    constructor(
        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>
    ) {
    }

    async findAll(): Promise<Role[]> {
        return await this.rolesRepository.find();
    }

    async findByValue(value: string): Promise<Role> {
        const role = await this.rolesRepository.findOne({where: {value}});
        if (!role) {
            throw new Error(`Role with value ${value} does not exist`);
        }
        return role;
    }

    async findById(id: number): Promise<Role> {
        const role = await this.rolesRepository.findOne({where: {id}});
        if (!role) {
            throw new Error(`Role with id ${id} does not exist`);
        }
        return role;
    }

    async save(dto: CreateRoleDto): Promise<Role> {
        const value = dto.value;
        const existingRole = await this.rolesRepository.findOne({where: {value}});
        if (existingRole) {
            throw new Error(`Role with value "${dto.value}" already exists`);
        }

        const role = this.rolesRepository.create(dto);
        return await this.rolesRepository.save(role);
    }

    async delete(id: number): Promise<void> {
        const role = await this.rolesRepository.findOne({where: {id}});
        if (!role) {
            throw new Error(`Role with id ${id} not found`);
        }
        await this.rolesRepository.delete(id);
    }
}