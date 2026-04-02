import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { EventComment } from './entities/event-comment.entity';
import { EventCommentsService } from './event-comments.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventComment, Event])],
  providers: [EventCommentsService],
  exports: [EventCommentsService],
})
export class EventCommentsModule {}
