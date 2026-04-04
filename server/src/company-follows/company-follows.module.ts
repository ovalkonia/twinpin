import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyFollow } from './entities/company-follow.entity';
import { CompanyFollowsService } from './company-follows.service';

@Module({
    imports: [TypeOrmModule.forFeature([CompanyFollow])],
    providers: [CompanyFollowsService],
    exports: [CompanyFollowsService],
})
export class CompanyFollowsModule {}