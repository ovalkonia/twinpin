import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { PromoCodesService } from './promo-codes.service';

class PromoCodeResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'SUMMER25' })
  code: string;

  @ApiProperty({ example: 20 })
  discount: number;

  @ApiProperty({ enum: ['percentage', 'fixed'], example: 'percentage' })
  discountType: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  validUntil?: string;

  @ApiPropertyOptional({ example: 100 })
  maxUses?: number;

  @ApiProperty({ example: 0 })
  usedCount: number;
}

class ValidatePromoCodeResponseDto {
  @ApiProperty({ example: 'uuid-here', description: 'Promo code ID — pass back to confirm at checkout' })
  id: string;

  @ApiProperty({ example: 'SUMMER25' })
  code: string;

  @ApiProperty({ example: 20 })
  discount: number;

  @ApiProperty({ enum: ['percentage', 'fixed'], example: 'percentage' })
  discountType: string;
}

class ValidatePromoCodeBodyDto {
  @ApiProperty({ example: 'SUMMER25', description: 'Promo code to validate' })
  code: string;
}

@ApiTags('promo-codes')
@Controller('events/:eventId/promo-codes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Create a promo code for an event (owner only)',
    description: 'Creates a percentage or fixed-amount discount code redeemable at checkout.',
  })
  @ApiParam({ name: 'eventId', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiBody({ type: CreatePromoCodeDto })
  @ApiOkResponse({ type: PromoCodeResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  create(
    @Param('eventId') eventId: string,
    @Body() dto: CreatePromoCodeDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.promoCodesService.create(eventId, dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List all promo codes for an event (owner only)' })
  @ApiParam({ name: 'eventId', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiOkResponse({ type: [PromoCodeResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  findByEvent(
    @Param('eventId') eventId: string,
    @CurrentUser('id') userId: number,
  ) {
    return this.promoCodesService.findByEvent(eventId, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a promo code (owner only)' })
  @ApiParam({ name: 'eventId', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiParam({ name: 'id', description: 'Promo code UUID', example: 'uuid-here' })
  @ApiNoContentResponse({ description: 'Promo code deleted' })
  @ApiNotFoundResponse({ description: 'Promo code not found' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.promoCodesService.remove(id, userId);
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Validate a promo code (public)',
    description:
      'Checks that the code exists, is active, has not expired, and has remaining uses. ' +
      'Does **not** consume the code — pass the code to `POST /events/:id/subscribe?promoCode=CODE` to apply it.',
  })
  @ApiParam({ name: 'eventId', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiBody({ type: ValidatePromoCodeBodyDto })
  @ApiOkResponse({ type: ValidatePromoCodeResponseDto })
  validateCode(
    @Param('eventId') eventId: string,
    @Body() body: { code: string },
  ) {
    return this.promoCodesService.validate(eventId, body.code);
  }
}