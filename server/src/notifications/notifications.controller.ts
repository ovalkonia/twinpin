import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { NotificationsService, ApiNotification } from './notifications.service';

class NotificationDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'event_comment', description: 'Machine-readable notification type' })
  type: string;

  @ApiProperty({ example: 'Alice commented on Tech Summit 2026' })
  message: string;

  @ApiProperty({ example: '2026-04-05T10:00:00Z' })
  date: string;

  @ApiProperty({ example: false })
  read: boolean;

  @ApiProperty({ enum: ['event', 'ticket', 'system'], example: 'event' })
  category: string;

  @ApiProperty({ example: 'Event Comment' })
  title: string;
}

@ApiTags('notifications')
@ApiBearerAuth('bearer')
@UseGuards(AuthGuard('jwt'))
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List your notifications',
    description: 'Returns all notifications for the current user, newest first.',
  })
  @ApiOkResponse({ type: [NotificationDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  list(@CurrentUser() user: User): Promise<ApiNotification[]> {
    return this.notifications.listForUser(user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', description: 'Notification UUID', example: 'uuid-here' })
  @ApiOkResponse({ type: NotificationDto })
  @ApiNotFoundResponse({ description: 'Notification not found or does not belong to current user' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  markRead(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<ApiNotification> {
    return this.notifications.markRead(user.id, id);
  }

  @Patch('mark-all-read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiNoContentResponse({ description: 'All notifications marked as read' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  markAllRead(@CurrentUser() user: User): Promise<void> {
    return this.notifications.markAllRead(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification UUID', example: 'uuid-here' })
  @ApiNoContentResponse({ description: 'Notification deleted' })
  @ApiNotFoundResponse({ description: 'Notification not found or does not belong to current user' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.notifications.deleteForUser(user.id, id);
  }
}