import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { PromoCodesService } from './promo-codes.service';

@Controller('events/:eventId/promo-codes')
@UseGuards(JwtAuthGuard)
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Post()
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreatePromoCodeDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.promoCodesService.create(eventId, dto, userId);
  }

  @Get()
  findByEvent(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.promoCodesService.findByEvent(eventId, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.promoCodesService.remove(id, userId);
  }
}