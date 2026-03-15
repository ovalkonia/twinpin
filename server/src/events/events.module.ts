import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { Event } from './entities/event.entity';
import { CompaniesModule } from '../companies/companies.module';
import { TicketsModule } from '../tickets/tickets.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PromocodesModule } from '../promocodes/promocodes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    CompaniesModule,
    forwardRef(() => TicketsModule),
    SubscriptionsModule,
    NotificationsModule,
    forwardRef(() => PromocodesModule),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}