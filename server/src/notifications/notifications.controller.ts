import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@CurrentUser() user) {
    return await this.notificationsService.findByUser(user.id);
  }

  @Get('unread')
  async findUnread(@CurrentUser() user) {
    return await this.notificationsService.findUnreadByUser(user.id);
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return await this.notificationsService.markAsRead(+id, user.id);
  }
}