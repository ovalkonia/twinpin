import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { PromoCode } from './entities/promocode.entity';
import { EventsService } from '../events/events.service';

@Injectable()
export class PromocodesService {
  constructor(
    @InjectRepository(PromoCode)
    private promocodesRepository: Repository<PromoCode>,
    @Inject(forwardRef(() => EventsService))
    private eventsService: EventsService,
  ) {}

  async create(eventId: number, createPromoCodeDto: any, userId: number) {
    const event = await this.eventsService.findOneEvent(eventId)
    if (!event) return { error: 'Event not found' }

    const company = await this.eventsService['companiesService'].findOneCompany(event.companyId)
    
    if (company?.ownerId !== userId) return { error: 'You can only create promocodes for your own events' }

    const existing = await this.promocodesRepository.findOne({
      where: { code: createPromoCodeDto.code, eventId },
    })

    if (existing) return { error: 'Promo code already exists for this event' }

    const promocode = this.promocodesRepository.create({
      ...createPromoCodeDto,
      event: { id: eventId },
    })

    return await this.promocodesRepository.save(promocode)
  }

  async findByEvent(eventId: number) {
    return await this.promocodesRepository.find({
      where: { eventId },
    })
  }

  async findOne(id: number) {
    return await this.promocodesRepository.findOne({
      where: { id },
      relations: ['event'],
    })
  }

  async validateAndApply(eventId: number, code: string) {
    const promocode = await this.promocodesRepository.findOne({
      where: { code, eventId, isActive: true },
    })

    if (!promocode) return { valid: false, error: 'Invalid promo code' }

    if (promocode.validUntil && new Date(promocode.validUntil) < new Date()) return { valid: false, error: 'Promo code expired' }

    if (promocode.usedCount >= promocode.maxUses) return { valid: false, error: 'Promo code usage limit reached' }

    return {
      valid: true,
      discount: +promocode.discount,
      discountType: promocode.discountType,
      promocodeId: promocode.id,
    }
  }

  async incrementUsedCount(id: number) {
    await this.promocodesRepository.increment({ id }, 'usedCount', 1)
  }

  async update(id: number, updatePromoCodeDto: any, userId: number) {
    const promocode = await this.findOne(id)
    if (!promocode) return { error: 'Promo code not found' }

    const event = await this.eventsService.findOneEvent(promocode.eventId)
    if (!event) return { error: 'Event not found' }
    const company = await this.eventsService['companiesService'].findOneCompany(event.companyId)
    if (!company) return { error: 'Company not found' }
    if (company.ownerId !== userId) return { error: 'You can only update your own promocodes' }

    await this.promocodesRepository.update(id, updatePromoCodeDto)
    return await this.findOne(id)
  }

  async remove(id: number, userId: number) {
    const promocode = await this.findOne(id)
    if (!promocode) return { error: 'Promo code not found' }

    const event = await this.eventsService.findOneEvent(promocode.eventId)
    if (!event) return { error: 'Event not found' }
    const company = await this.eventsService['companiesService'].findOneCompany(event.companyId)
    if (!company) return { error: 'Company not found' }
    if (company.ownerId !== userId) return { error: 'You can only delete your own promocodes' }

    return await this.promocodesRepository.delete(id)
  }
}