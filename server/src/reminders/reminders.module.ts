import { Module, forwardRef } from '@nestjs/common';  
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemindersService } from './reminders.service';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Ticket]),
    forwardRef(() => MailModule),  
    forwardRef(() => NotificationsModule), 
  ],
  providers: [RemindersService],
})
export class RemindersModule {}