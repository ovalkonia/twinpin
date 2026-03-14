import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    @InjectRepository(Ticket)
    private ticketsRepository: Repository<Ticket>,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('0 9 * * *')
  async sendEventReminders() {
    console.log('Checking for events in 24 hours...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(tomorrow.getTime() + 60 * 60 * 1000);

    const events = await this.eventsRepository.find({
      where: {
        date: Between(tomorrow, dayAfterTomorrow),
      },
    });

    console.log(`Found ${events.length} events starting in ~24 hours`);

    for (const event of events) {
      const tickets = await this.ticketsRepository.find({
        where: {
          event: { id: event.id },
          status: 'registered',
        },
        relations: ['user'],
      });

      console.log(`Event ${event.title}: ${tickets.length} registered users`);

      for (const ticket of tickets) {
        await this.mailService.sendReminderEmail(ticket.user.email, {
          eventTitle: event.title,
          eventDate: event.date.toLocaleString(),
          eventLocation: event.location,
          userName: ticket.user.fullName,
        });

        await this.notificationsService.create(
          ticket.user.id,
          'reminder',
          `Reminder: ${event.title} starts tomorrow`,
          { eventId: event.id }
        );
      }
    }
  }
}