import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'


import { CreateEventDto } from './dto/create-event.dto'
import { UpdateEventDto } from './dto/update-event.dto'
import { Event } from './entities/event.entity'
import { CompaniesService } from 'src/companies/companies.service'



@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventsRepository: Repository<Event>,
    private companiesService: CompaniesService,
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

  async findAllEvent(category?: string, date?: Date) {
    const whereConditions: any = {}
    
    if (category) whereConditions.category = category
    if (date) whereConditions.date = date

    return await this.eventsRepository.find({
      where: whereConditions,
      relations: ['company'],
      order: { date: 'ASC' } 
    })
  }

  async findOneEvent(id: number) {
    return await this.eventsRepository.findOne({
      where: { id }, 
      relations: ['company'],
    })
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
