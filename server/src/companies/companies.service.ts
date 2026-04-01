import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';

const STATS = { eventsCreated: 0, totalAttendees: 0 };

@Injectable()
export class CompaniesService {
    constructor(
        @InjectRepository(Company)
        private readonly companyRepo: Repository<Company>,
        private readonly usersService: UsersService,
    ) {}

    async create(
        userId: number,
        dto: CreateCompanyDto,
        logoUrl?: string,
        coverUrl?: string,
    ): Promise<Company & { stats: typeof STATS }> {
        const owner = await this.usersService.findOne(userId);

        const data: DeepPartial<Company> = {
            ...dto,
            logoUrl: logoUrl ?? undefined,
            coverUrl: coverUrl ?? undefined,
            owner,
        };
        const company = this.companyRepo.create(data);
        const saved = await this.companyRepo.save(company);
        return Object.assign(saved, { stats: STATS }) as unknown as Company & { stats: typeof STATS };
    }

    async findMy(userId: number): Promise<Company & { stats: typeof STATS }> {
        const company = await this.companyRepo.findOne({
            where: { owner: { id: userId } },
            relations: ['owner', 'members'],
        });

        if (!company) throw new NotFoundException('You have no registered company');
        return Object.assign(company, { stats: STATS }) as unknown as Company & { stats: typeof STATS };
    }

    async findBySlug(slug: string): Promise<Company & { stats: typeof STATS }> {
        const company = await this.companyRepo.findOne({
            where: { slug },
            relations: ['owner', 'members'],
        });

        if (!company) throw new NotFoundException(`Company "${slug}" not found`);
        return Object.assign(company, { stats: STATS }) as unknown as Company & { stats: typeof STATS };
    }

    async update(
        id: number,
        userId: number,
        dto: UpdateCompanyDto,
        logoUrl?: string,
        coverUrl?: string,
    ): Promise<Company & { stats: typeof STATS }> {
        const company = await this.companyRepo.findOne({
            where: { id },
            relations: ['owner'],
        });

        if (!company) throw new NotFoundException('Company not found');
        if (company.owner.id !== userId) throw new ForbiddenException('Not the owner');

        Object.assign(company, dto);

        if (logoUrl) company.logoUrl = logoUrl;
        if (coverUrl) company.coverUrl = coverUrl;

        const saved = await this.companyRepo.save(company);
        return { ...saved, stats: STATS };
    }

    async getMembers(companyId: number) {
        const company = await this.companyRepo.findOne({
            where: { id: companyId },
            relations: ['members'],
        });

        if (!company) throw new NotFoundException('Company not found');

        return company.members.map(({ id, name, email }) => ({ id, name, email }));
    }

    async addMember(companyId: number, email: string, requestingUserId: number) {
        const company = await this.companyRepo.findOne({
            where: { id: companyId },
            relations: ['owner', 'members'],
        });

        if (!company) throw new NotFoundException('Company not found');
        if (company.owner.id !== requestingUserId) throw new ForbiddenException('Not the owner');

        const user = await this.usersService.findByEmail(email);

        const alreadyMember = company.members.some(m => m.id === user.id);
        if (!alreadyMember) {
            company.members.push(user);
            await this.companyRepo.save(company);
        }

        return { id: user.id, name: user.name, email: user.email };
    }

    async removeMember(companyId: number, memberId: number, requestingUserId: number) {
        const company = await this.companyRepo.findOne({
            where: { id: companyId },
            relations: ['owner', 'members'],
        });

        if (!company) throw new NotFoundException('Company not found');
        if (company.owner.id !== requestingUserId) throw new ForbiddenException('Not the owner');

        company.members = company.members.filter(m => m.id !== memberId);
        await this.companyRepo.save(company);
    }
}