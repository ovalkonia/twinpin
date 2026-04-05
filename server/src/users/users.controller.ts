import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  BadRequestException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const uploadFields = FileFieldsInterceptor(
  [{ name: 'avatar', maxCount: 1 }],
  { storage: memoryStorage() },
);

class PublicUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Alice Smith' })
  name: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/…' })
  avatarUrl?: string;

  @ApiProperty({ example: true })
  profilePublic: boolean;

  @ApiProperty({ example: 'user', enum: ['user', 'organizer', 'admin'] })
  role: string;
}

class UserEventDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Tech Summit 2026' })
  title: string;

  @ApiProperty({ example: 'tech' })
  category: string;

  @ApiProperty({ example: '2026-06-01T10:00:00Z' })
  date: string;

  @ApiPropertyOptional({ example: 'Berlin' })
  location?: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/…' })
  coverUrl?: string;
}

class UserTicketDto {
  @ApiProperty({ description: 'Event UUID', example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Tech Summit 2026' })
  title: string;

  @ApiProperty({ example: 'tech' })
  category: string;

  @ApiProperty({ example: '2026-06-01T10:00:00Z' })
  date: string;

  @ApiPropertyOptional({ example: 'Berlin' })
  location?: string;

  @ApiProperty({ example: 2 })
  ticketCount: number;

  @ApiPropertyOptional({ example: 29.99 })
  price?: number;

  @ApiPropertyOptional({ example: 'EUR' })
  currency?: string;

  @ApiPropertyOptional()
  coverUrl?: string;

  @ApiProperty({ description: 'Whether this booking is hidden from the attendee list', example: false })
  hidden: boolean;
}

class SetTicketHiddenDto {
  @ApiProperty({ description: 'Set to true to hide, false to show in attendee list', example: false })
  hidden: boolean;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: "Get the currently authenticated user's profile" })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  getMe(@Req() req: { user: User }) {
    return this.usersService.toPublicUser(req.user);
  }

  @Get()
  @ApiOperation({ summary: 'List all users (admin / debug)' })
  @ApiOkResponse({ type: [PublicUserDto] })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id/events')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List events created by a user' })
  @ApiParam({ name: 'id', description: 'User ID', example: 1 })
  @ApiOkResponse({ type: [UserEventDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  getUserEvents(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.listEventsForUser(id);
  }

  @Get(':id/tickets')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'List tickets (bookings) for a user',
    description: 'Hidden bookings are only visible to the ticket owner. Other callers see `hidden: false` bookings only.',
  })
  @ApiParam({ name: 'id', description: 'User ID', example: 1 })
  @ApiOkResponse({ type: [UserTicketDto] })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  getUserTickets(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() requester: User,
  ) {
    return this.usersService.listTicketsForUser(id, requester.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a public user profile by ID' })
  @ApiParam({ name: 'id', description: 'User ID', example: 1 })
  @ApiOkResponse({ type: PublicUserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOnePublic(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user directly (internal / testing)' })
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({ type: PublicUserDto })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch('me/tickets/:eventId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Toggle ticket visibility for an event',
    description:
      'Sets `hidden` on all bookings the current user has for this event. ' +
      'Hidden bookings are excluded from attendee lists and other users\' ticket views.',
  })
  @ApiParam({ name: 'eventId', description: 'Event UUID (v4)', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiBody({ type: SetTicketHiddenDto })
  @ApiNoContentResponse({ description: 'Visibility updated' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async updateTicketVisibility(
    @Param('eventId', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @CurrentUser() user: User,
    @Body() body: { hidden: boolean },
  ): Promise<void> {
    await this.usersService.setTicketHidden(user.id, eventId, body.hidden);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user name or password' })
  @ApiParam({ name: 'id', description: 'User ID', example: 1 })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ type: PublicUserDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/avatar')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @UseInterceptors(uploadFields)
  @ApiOperation({ summary: "Upload or replace the user's avatar image" })
  @ApiParam({ name: 'id', description: 'User ID (must match authenticated user)', example: 1 })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['avatar'],
      properties: {
        avatar: { type: 'string', format: 'binary', description: 'Image file (JPEG / PNG / WebP)' },
      },
    },
  })
  @ApiOkResponse({ type: PublicUserDto, description: 'Updated profile with new avatarUrl' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async updateAvatar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
    @UploadedFiles() files: { avatar?: Express.Multer.File[] },
  ) {
    if (user.id !== id) {
      throw new ForbiddenException('You can only update your own avatar');
    }
    const file = files?.avatar?.[0];
    if (!file) {
      throw new BadRequestException('avatar file is required');
    }

    const avatarUrl = await this.cloudinary.upload(file, 'users/avatars');
    const updated = await this.usersService.updateAvatar(id, avatarUrl);
    return this.usersService.toPublicUser(updated);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user account' })
  @ApiParam({ name: 'id', description: 'User ID', example: 1 })
  @ApiNoContentResponse({ description: 'User deleted' })
  @ApiNotFoundResponse({ description: 'User not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}