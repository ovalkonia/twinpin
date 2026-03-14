import { Controller, Get, Post, Param, Delete, UseGuards } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('events/:id/register')
  @UseGuards(JwtAuthGuard)
  async registerTicket(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return await this.ticketsService.registerTicket(+id, user.id)
  }

  @Get('events/:id/tickets')
  @UseGuards(JwtAuthGuard)
  async findTicketByEvent(@Param('id') id: string) {
    return await this.ticketsService.findByEvent(+id)
  }

  @Get('events/:id/attendees')
  async getAttendees(@Param('id') id: string) {
    return await this.ticketsService.getAttendees(+id)
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async findTicketByUser(@CurrentUser() user) {
    return await this.ticketsService.findByUser(user.id)
  }

  @Delete(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelTicket(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return await this.ticketsService.cancelTicket(+id, user.id)
  }
}