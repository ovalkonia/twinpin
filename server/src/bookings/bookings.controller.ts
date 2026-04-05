import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BookingsService } from './bookings.service';

class ValidateTicketDto {
  @ApiProperty({ description: 'Ticket code UUID from the booking QR code' })
  @IsString()
  @IsUUID()
  code: string;
}

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate and mark a ticket as used (organizer only)' })
  validate(
    @Body() dto: ValidateTicketDto,
    @CurrentUser() user: User,
  ) {
    return this.bookings.validateTicket(dto.code, user.id);
  }
}
