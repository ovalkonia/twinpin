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
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreatePromoCodeDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.promoCodesService.create(eventId, dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findByEvent(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.promoCodesService.findByEvent(eventId, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.promoCodesService.remove(id, userId);
  }

  /** Public — validate a code without consuming it. Returns discount details. */
  @Post('validate')
  validateCode(
    @Param('eventId') eventId: string,
    @Body() body: { code: string },
  ) {
    return this.promoCodesService.validate(eventId, body.code);
  }
}