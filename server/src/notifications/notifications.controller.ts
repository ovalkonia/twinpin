import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { NotificationsService, ApiNotification } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List your notifications' })
  list(@CurrentUser() user: User): Promise<ApiNotification[]> {
    return this.notifications.listForUser(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  markRead(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ApiNotification> {
    return this.notifications.markRead(user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.notifications.deleteForUser(user.id, id);
  }
}

