import { Controller, Delete, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { OrganizerFollowsService } from './organizer-follows.service';

@ApiTags('organizers')
@Controller('organizers')
export class OrganizersController {
  constructor(private readonly organizerFollows: OrganizerFollowsService) {}

  @Post(':organizerId/follow')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow an organizer (user id)' })
  async follow(
    @Param('organizerId', ParseIntPipe) organizerId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.organizerFollows.follow(user.id, organizerId);
  }

  @Delete(':organizerId/follow')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  async unfollow(
    @Param('organizerId', ParseIntPipe) organizerId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.organizerFollows.unfollow(user.id, organizerId);
  }
}
