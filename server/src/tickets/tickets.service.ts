import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { EventsService } from '../events/events.service';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private ticketRepository: Repository<Ticket>,
    @Inject(forwardRef(() => EventsService))
    private eventsService: EventsService,
  ) {}

  async registerTicket(eventId: number, userId: number) {
    const event = await this.eventsService.findOneEvent(eventId)
    if (!event) return { error: 'Event not found' }

    const existingTicket = await this.ticketRepository.findOne({
      where: {
        event: { id: eventId },
        user: { id: userId },
        status: 'registered'
      }
    });
    
    if (existingTicket) return { error: 'Already registered for this event' }

    const ticketsCount = await this.ticketRepository.count({
      where: {
        event: { id: eventId },
        status: 'registered'
      }
    })

    if (ticketsCount >= event.maxTickets) return { error: 'No tickets left' }

    const ticketNumber = `TICKET-${eventId}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`

    const newTicket = this.ticketRepository.create({
      user: { id: userId },
      event: { id: eventId },
      ticketNumber,
      status: 'registered'
    })

    return await this.ticketRepository.save(newTicket)
  }

  async findByEvent(eventId: number) {
    return await this.ticketRepository.find({
      where: { event: { id: eventId } },
      relations: ['user'],
    })
  }

  async findByUser(userId: number) {
    return await this.ticketRepository.find({
      where: { user: { id: userId } },
      relations: ['event'],
    })
  }

  async cancelTicket(ticketId: number, userId: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['user'],
    })

    if (!ticket) return { error: 'Ticket not found' }
    if (ticket.user.id !== userId) return { error: 'You can only cancel your own tickets' }
    if (ticket.status === 'cancelled') return { error: 'Ticket already cancelled' }

    ticket.status = 'cancelled'
    return await this.ticketRepository.save(ticket)
  }

  async countByEvent(eventId: number) {
    return await this.ticketRepository.count({
      where: {
        event: { id: eventId },
        status: 'registered'
      }
    })
  }

  async getAttendees(eventId: number) {
    const tickets = await this.ticketRepository.find({
      where: { event: { id: eventId }, status: 'registered' },
      relations: ['user'],
    });
    
    return tickets
      .filter(t => t.user.isVisibleInVisitorList)
      .map(t => ({ name: t.user.fullName }))
  }
}