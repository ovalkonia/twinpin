import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'

import { CreateEventDto } from './dto/create-event.dto'
import { UpdateEventDto } from './dto/update-event.dto'
import { Event } from './entities/event.entity'
import { CompaniesService } from 'src/companies/companies.service'
import { TicketsService } from '../tickets/tickets.service'

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    private companiesService: CompaniesService,
    @Inject(forwardRef(() => TicketsService))
    private ticketsService: TicketsService,
  ){}

  async createEvent(createEventDto: CreateEventDto, userId: number) {
    const company = await this.companiesService.findOneCompany(createEventDto.companyId)
    if (!company) return { error: "company does not exist in our database"}

    if (company.ownerId !== userId) return { error: "You can only create events for your own companies" }

    const newEvent = this.eventsRepository.create({
      ...createEventDto,
      company: { id: createEventDto.companyId }
    })

    return await this.eventsRepository.save(newEvent)
  }

  async findAllEvent(
    category?: string, 
    date?: Date, 
    page?: number, 
    limit?: number
  ) {
    const whereConditions: any = {}
    
    if (category) whereConditions.category = category
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      
      whereConditions.date = Between(start, end)
    }

    if (!page || !limit) {
      return await this.eventsRepository.find({
        where: whereConditions,
        relations: ['company'],
        order: { date: 'ASC' }
      });
    }

    const skip = (page - 1) * limit;
    const [data, total] = await this.eventsRepository.findAndCount({
      where: whereConditions,
      relations: ['company'],
      order: { date: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit
    };
  }

  async findOneEvent(id: number) {
    const event = await this.eventsRepository.findOne({
      where: { id }, 
      relations: ['company', 'comments', 'comments.user'], // ← добавили комментарии
    });
    
    if (!event) return null
    
    const ticketsCount = await this.ticketsService.countByEvent(id)
    
    return {
      ...event,
      availableTickets: event.maxTickets - ticketsCount
    }
  }

  async updateEvent(id: number, updateEventDto: UpdateEventDto, userId: number) {
    const event = await this.findOneEvent(id)
    if (!event) return { error: 'Event not found' }

    const company = await this.companiesService.findOneCompany(event.companyId)
    console.log('Company:', company)
    if (company?.ownerId !== userId) return { error: 'You can only update your own events' }

    await this.eventsRepository.update(id, updateEventDto)
    
    return await this.findOneEvent(id)
  }

  async removeEvent(id: number) {
    return await this.eventsRepository.delete({id})
  }
}