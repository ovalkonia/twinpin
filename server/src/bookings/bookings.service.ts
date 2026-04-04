import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/user.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { Booking } from './entities/booking.entity';
import { StripePaymentSimulationService } from './stripe-payment-simulation.service';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly payments: StripePaymentSimulationService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  async sumQuantityForTicket(ticketId: string): Promise<number> {
    const row = await this.bookingRepo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.quantity), 0)', 'sum')
      .where('b.ticketId = :id', { id: ticketId })
      .getRawOne<{ sum: string }>();
    return Number(row?.sum ?? 0);
  }

  async sumQuantityByEventIds(
    eventIds: string[],
  ): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (!eventIds.length) return map;
    const rows = await this.bookingRepo
      .createQueryBuilder('b')
      .innerJoin('b.ticket', 'tk')
      .select('tk.eventId', 'eventId')
      .addSelect('COALESCE(SUM(b.quantity), 0)', 'qty')
      .where('tk.eventId IN (:...ids)', { ids: eventIds })
      .groupBy('tk.eventId')
      .getRawMany<{ eventId: string; qty: string }>();
    for (const r of rows) {
      map.set(r.eventId, Number(r.qty));
    }
    return map;
  }

  async totalBookedForEvent(eventId: string): Promise<number> {
    const row = await this.bookingRepo
      .createQueryBuilder('b')
      .innerJoin('b.ticket', 'tk')
      .select('COALESCE(SUM(b.quantity), 0)', 'sum')
      .where('tk.eventId = :eid', { eid: eventId })
      .getRawOne<{ sum: string }>();
    return Number(row?.sum ?? 0);
  }

  userHasBookingForEvent(userId: number, eventId: string): Promise<boolean> {
    return this.bookingRepo.exist({
      where: {
        user: { id: userId },
        ticket: { event: { id: eventId } },
      },
    });
  }

  async recordPurchase(params: {
    userId: number;
    event: Event;
    tier: Ticket;
    quantity: number;
    hidden?: boolean;
    finalAmount?: number;
    userEmail?: string;
    userName?: string;
  }): Promise<void> {
    const { userId, event, tier, quantity, hidden = false, finalAmount, userEmail, userName } = params;
    const unitPrice = Number(tier.price);
    const pay = await this.payments.chargeForEvent({
      userId,
      eventId: event.id,
      amount: finalAmount ?? unitPrice * quantity,
      currency: tier.currency,
    });
    if (pay.status !== 'succeeded') {
      throw new BadRequestException('Payment failed');
    }

    const booking = this.bookingRepo.create({
      user: { id: userId } as User,
      ticket: tier,
      quantity,
      stripePaymentIntentId: pay.paymentIntentId,
      paymentStatus: pay.status,
      hidden,
    });
    await this.bookingRepo.save(booking);

    await this.notifications.notifyUser(
      userId,
      'event_booking',
      `Your booking for "${event.title}" (${tier.name}) is confirmed.`,
    );

    if (userEmail) {
      const ticketCode = `TKT-${String(userId).slice(0, 6)}${event.id.slice(0, 6)}`.toUpperCase();
      void this.mail.sendBookingConfirmation(
        userEmail,
        userName ?? 'there',
        event.title,
        event.date.toISOString(),
        ticketCode,
      );
    }

    if (event.notifyOnNewVisitor) {
      await this.notifications.notifyUser(
        event.company.owner.id,
        'event_new_visitor',
        `Someone new registered for "${event.title}".`,
      );
    }
  }

  async removeAllForUserAndEvent(userId: number, eventId: string): Promise<number> {
    const bookings = await this.bookingRepo.find({
      where: { user: { id: userId }, ticket: { event: { id: eventId } } },
    });
    if (!bookings.length) return 0;
    await this.bookingRepo.remove(bookings);
    return bookings.length;
  }

  findForAttendeeList(eventId: string): Promise<Booking[]> {
    return this.bookingRepo.find({
      where: { ticket: { event: { id: eventId } }, hidden: false },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async setHiddenForUserEvent(
    userId: number,
    eventId: string,
    hidden: boolean,
  ): Promise<void> {
    const bookings = await this.bookingRepo.find({
      where: { user: { id: userId }, ticket: { event: { id: eventId } } },
    });
    for (const b of bookings) {
      b.hidden = hidden;
    }
    await this.bookingRepo.save(bookings);
  }
}
