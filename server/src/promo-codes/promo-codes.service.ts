import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { PromoCode } from './entities/promo-code.entity';

@Injectable()
export class PromoCodesService {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoRepo: Repository<PromoCode>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async create(
    eventId: string,
    dto: CreatePromoCodeDto,
    userId: number,
  ): Promise<PromoCode> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['company', 'company.owner'],
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.company.owner.id !== userId) {
      throw new ForbiddenException('You can only add promo codes to your own events');
    }

    const exists = await this.promoRepo.findOne({
      where: { code: dto.code, event: { id: eventId } },
    });
    if (exists) throw new ConflictException('A promo code with that code already exists for this event');

    const promo = this.promoRepo.create({
      code: dto.code,
      discount: dto.discount,
      discountType: dto.discountType ?? 'percentage',
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      maxUses: dto.maxUses ?? 1,
      event: { id: eventId } as Event,
    });
    return this.promoRepo.save(promo);
  }

  async findByEvent(eventId: string, userId: number): Promise<PromoCode[]> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: ['company', 'company.owner'],
    });
    if (!event) throw new NotFoundException('Event not found');
    if (event.company.owner.id !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.promoRepo.find({ where: { event: { id: eventId } } });
  }

  async remove(id: string, userId: number): Promise<void> {
    const promo = await this.promoRepo.findOne({
      where: { id },
      relations: ['event', 'event.company', 'event.company.owner'],
    });
    if (!promo) throw new NotFoundException('Promo code not found');
    if (promo.event.company.owner.id !== userId) {
      throw new ForbiddenException('You can only delete your own promo codes');
    }
    await this.promoRepo.delete(id);
  }

  /** Validate a promo code for an event without consuming it. */
  async validate(eventId: string, code: string): Promise<PromoCode> {
    const promo = await this.promoRepo.findOne({
      where: { code, event: { id: eventId }, isActive: true },
    });
    if (!promo) throw new NotFoundException('Invalid promo code');
    if (promo.validUntil && promo.validUntil < new Date()) {
      throw new BadRequestException('Promo code has expired');
    }
    if (promo.usedCount >= promo.maxUses) {
      throw new BadRequestException('Promo code has reached its usage limit');
    }
    return promo;
  }

  /** Increment usedCount after a successful booking. */
  async redeem(id: string): Promise<void> {
    await this.promoRepo.increment({ id }, 'usedCount', 1);
  }
}