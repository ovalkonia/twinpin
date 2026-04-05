import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { EventComment } from './entities/event-comment.entity';
import { EventCommentsService } from './event-comments.service';
import { EventSubscriptionsModule } from '../event-subscriptions/event-subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventComment, Event]),
    EventSubscriptionsModule,
    NotificationsModule,
  ],
  providers: [EventCommentsService],
  exports: [EventCommentsService],
})
export class EventCommentsModule {}
