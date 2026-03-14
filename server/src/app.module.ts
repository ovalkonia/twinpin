import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

import { User } from './users/entities/user.entity';
import { Company } from './companies/entities/company.entity';
import { Event } from './events/entities/event.entity';
import { Ticket } from './tickets/entities/ticket.entity';

import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { EventsModule } from './events/events.module';
import { TicketsModule } from './tickets/tickets.module';
import { PaymentsModule } from './payments/payments.module';
import { MailModule } from './mail/mail.module';
import { RemindersModule } from './reminders/reminders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { Notification } from './notifications/entities/notification.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '23451',
      database: 'postgres',
      entities: [User, Company, Event, Ticket, Notification],
      synchronize: true,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    CompaniesModule,
    EventsModule,
    TicketsModule,
    PaymentsModule,
    MailModule,
    RemindersModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService], 
})
export class AppModule {}