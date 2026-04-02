import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BookingsModule } from '../bookings/bookings.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CompaniesModule } from '../companies/companies.module';
import { EventCommentsModule } from '../event-comments/event-comments.module';
import { TicketsModule } from '../tickets/tickets.module';
import { UsersModule } from '../users/users.module';
import { Event } from './entities/event.entity';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    CompaniesModule,
    CloudinaryModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    BookingsModule,
    EventCommentsModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
