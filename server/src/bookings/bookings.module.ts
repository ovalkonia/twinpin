import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { Booking } from './entities/booking.entity';
import { BookingsService } from './bookings.service';
import { StripePaymentSimulationService } from './stripe-payment-simulation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking]), NotificationsModule],
  providers: [BookingsService, StripePaymentSimulationService],
  exports: [BookingsService, StripePaymentSimulationService],
})
export class BookingsModule {}
