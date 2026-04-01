import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Company]), UsersModule],
    controllers: [CompaniesController],
    providers: [CompaniesService],
})
export class CompaniesModule {}