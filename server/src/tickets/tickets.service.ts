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
    return this.createTier(event, {
      name: 'General admission',
      description: null,
      price: input.price,
      currency: input.currency,
      capacity: input.capacity,
      sortOrder: 0,
      isDefault: true,
    });
  }

  async createTier(
    event: Event,
    input: {
      name: string;
      description?: string | null;
      price: number;
      currency: string;
      capacity: number | null | undefined;
      sortOrder: number;
      isDefault: boolean;
    },
  ): Promise<Ticket> {
    const tier = this.ticketRepo.create({
      event,
      name: input.name,
      description: input.description ?? null,
      price: String(input.price ?? 0),
      currency: input.currency,
      quantityAvailable: input.capacity ?? null,
      sortOrder: input.sortOrder,
      isDefault: input.isDefault,
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

  findById(id: string): Promise<Ticket | null> {
    return this.ticketRepo.findOne({ where: { id }, relations: ['event'] });
  }

  async patchTier(
    tier: Ticket,
    dto: { name?: string; capacity?: number | null },
  ): Promise<Ticket> {
    if (dto.name !== undefined) tier.name = dto.name;
    if ('capacity' in dto) tier.quantityAvailable = dto.capacity ?? null;
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
