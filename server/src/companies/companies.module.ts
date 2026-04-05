import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { CompanyFollowsModule } from '../company-follows/company-follows.module';

@Module({
    imports: [TypeOrmModule.forFeature([Company]), UsersModule, CompanyFollowsModule],
    controllers: [CompaniesController],
    providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}