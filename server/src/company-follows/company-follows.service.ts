import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { CompanyFollow } from './entities/company-follow.entity';

@Injectable()
export class CompanyFollowsService {
    constructor(
        @InjectRepository(CompanyFollow)
        private readonly repo: Repository<CompanyFollow>,
    ) {}

    async follow(userId: number, companyId: number): Promise<void> {
        const exists = await this.repo.exist({
            where: { user: { id: userId }, company: { id: companyId } },
        });
        if (exists) return;
        await this.repo.save(
            this.repo.create({
                user: { id: userId } as User,
                company: { id: companyId } as Company,
            }),
        );
    }

    async unfollow(userId: number, companyId: number): Promise<void> {
        await this.repo.delete({ user: { id: userId }, company: { id: companyId } });
    }

    async isFollowing(userId: number, companyId: number): Promise<boolean> {
        return this.repo.exist({
            where: { user: { id: userId }, company: { id: companyId } },
        });
    }

    async getFollowerIds(companyId: number): Promise<number[]> {
        const rows = await this.repo.find({
            where: { company: { id: companyId } },
            relations: ['user'],
        });
        return rows.map((r) => r.user.id);
    }
}