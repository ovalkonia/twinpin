import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator'




@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createEvent(
    @Body() createEventDto: CreateEventDto, 
    @CurrentUser() user,
  ) {
    console.log(createEventDto)
    return await this.eventsService.createEvent(createEventDto, user.id)
  }

  @Get()
  async findAllEvents(
    @Query('category') category?: string,
    @Query('date') date?: string,
  ) {
    const dateObj = date ? new Date(date) : undefined
    return await this.eventsService.findAllEvent(category, dateObj)
  }

  @Get(':id')
  async findOneEvent(@Param('id') id: string) {
    const event = await this.eventsService.findOneEvent(+id)
    if (!event) return { error: 'Event not found' }
    return event
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateEvent(
    @Param('id') id: string, 
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user,
  ) {
    return await this.eventsService.updateEvent(+id, updateEventDto, user.id)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async removeEvent(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    const event = await this.eventsService.findOneEvent(+id)
    if (!event) return { error: "Event not found" }

    if (event.company?.ownerId !== user.id) return { error: "You can only remove your own events" }

    await this.eventsService.removeEvent(+id)

    return { message: "Event deleted successfully" }
  }
}
