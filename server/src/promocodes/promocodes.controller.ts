import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PromocodesService } from './promocodes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('promocodes')
export class PromocodesController {
  constructor(private readonly promocodesService: PromocodesService) {}

  @Post('events/:id/promocodes')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('id') id: string,
    @Body() createPromoCodeDto: any,
    @CurrentUser() user,
  ) {
    return await this.promocodesService.create(+id, createPromoCodeDto, user.id)
  }

  @Get('events/:id/promocodes')
  async findByEvent(@Param('id') id: string) {
    return await this.promocodesService.findByEvent(+id)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.promocodesService.findOne(+id)
  }

  @Post('validate')
  async validate(@Body() body: { eventId: number; code: string }) {
    return await this.promocodesService.validateAndApply(body.eventId, body.code)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updatePromoCodeDto: any,
    @CurrentUser() user,
  ) {
    return await this.promocodesService.update(+id, updatePromoCodeDto, user.id)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return await this.promocodesService.remove(+id, user.id)
  }
}