import { Controller, Post, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('events/:id/subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribeToEvent(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return await this.subscriptionsService.subscribe(user.id, 'event', +id)
  }

  @Delete('events/:id/subscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribeFromEvent(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return await this.subscriptionsService.unsubscribe(user.id, 'event', +id)
  }

  @Post('companies/:id/subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribeToCompany(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return await this.subscriptionsService.subscribe(user.id, 'company', +id)
  }

  @Delete('companies/:id/subscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribeFromCompany(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return await this.subscriptionsService.unsubscribe(user.id, 'company', +id)
  }

  @Get('events/:id/is-subscribed')
  @UseGuards(JwtAuthGuard)
  async isSubscribedToEvent(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return {
      subscribed: await this.subscriptionsService.isSubscribed(user.id, 'event', +id),
    }
  }

  @Get('companies/:id/is-subscribed')
  @UseGuards(JwtAuthGuard)
  async isSubscribedToCompany(
    @Param('id') id: string,
    @CurrentUser() user,
  ) {
    return {
      subscribed: await this.subscriptionsService.isSubscribed(user.id, 'company', +id),
    }
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMySubscriptions(@CurrentUser() user) {
    return await this.subscriptionsService.getUserSubscriptions(user.id)
  }
}