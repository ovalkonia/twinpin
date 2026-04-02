import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizerFollow } from './entities/organizer-follow.entity';
import { OrganizersController } from './organizers.controller';
import { OrganizerFollowsService } from './organizer-follows.service';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizerFollow])],
  controllers: [OrganizersController],
  providers: [OrganizerFollowsService],
  exports: [OrganizerFollowsService],
})
export class OrganizerFollowsModule {}
