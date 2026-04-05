import { Controller, Delete, HttpCode, HttpStatus, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { OrganizerFollowsService } from './organizer-follows.service';

@ApiTags('organizers')
@Controller('organizers')
export class OrganizersController {
  constructor(private readonly organizerFollows: OrganizerFollowsService) {}

  @Post(':organizerId/follow')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Follow an organizer user',
    description: 'Follows a user by their user ID. Note: company follows use `/companies/:id/follow`.',
  })
  @ApiParam({ name: 'organizerId', description: 'User ID of the organizer to follow', example: 5 })
  @ApiNoContentResponse({ description: 'Now following' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async follow(
    @Param('organizerId', ParseIntPipe) organizerId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.organizerFollows.follow(user.id, organizerId);
  }

  @Delete(':organizerId/follow')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unfollow an organizer user' })
  @ApiParam({ name: 'organizerId', description: 'User ID of the organizer to unfollow', example: 5 })
  @ApiNoContentResponse({ description: 'Unfollowed' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async unfollow(
    @Param('organizerId', ParseIntPipe) organizerId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.organizerFollows.unfollow(user.id, organizerId);
  }
}