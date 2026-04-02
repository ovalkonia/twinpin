import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { Ticket } from './entities/ticket.entity';

export type TicketMetricRow = {
  eventId: string;
  price: string;
  currency: string;
  quantityAvailable: string | null;
  sortOrder: string;
};

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
  ) {}

  async createGeneralAdmission(
    event: Event,
    input: {
      price: number;
      currency: string;
      capacity: number | null | undefined;
    },
  ): Promise<Ticket> {
    const tier = this.ticketRepo.create({
      event,
      name: 'General admission',
      description: null,
      price: String(input.price),
      currency: input.currency,
      quantityAvailable: input.capacity ?? null,
      sortOrder: 0,
      isDefault: true,
    });
    return this.ticketRepo.save(tier);
  }

  findDefaultByEventId(eventId: string): Promise<Ticket | null> {
    return this.ticketRepo.findOne({
      where: { event: { id: eventId }, isDefault: true },
    });
  }

  findOrderedForEvent(eventId: string): Promise<Ticket[]> {
    return this.ticketRepo.find({
      where: { event: { id: eventId } },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  findAllForEvent(eventId: string): Promise<Ticket[]> {
    return this.ticketRepo.find({ where: { event: { id: eventId } } });
  }

  save(tier: Ticket): Promise<Ticket> {
    return this.ticketRepo.save(tier);
  }

  async getTierMetricRows(eventIds: string[]): Promise<TicketMetricRow[]> {
    if (!eventIds.length) return [];
    return this.ticketRepo
      .createQueryBuilder('t')
      .select('t.eventId', 'eventId')
      .addSelect('t.price', 'price')
      .addSelect('t.currency', 'currency')
      .addSelect('t.quantityAvailable', 'quantityAvailable')
      .addSelect('t.sortOrder', 'sortOrder')
      .where('t.eventId IN (:...ids)', { ids: eventIds })
      .orderBy('t.eventId', 'ASC')
      .addOrderBy('t.sortOrder', 'ASC')
      .addOrderBy('t.price', 'ASC')
      .getRawMany<TicketMetricRow>();
  }
}
