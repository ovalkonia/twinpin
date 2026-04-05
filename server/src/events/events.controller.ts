import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EventCommentsService } from '../event-comments/event-comments.service';
import { EventSubscriptionsService } from '../event-subscriptions/event-subscriptions.service';
import { User } from '../users/entities/user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AddEventCommentDto } from './dto/add-event-comment.dto';
import {
  EventCommentResponseDto,
  EventAttendeeResponseDto,
  EventResponseDto,
  PaginatedEventsResponseDto,
  TicketTierResponseDto,
} from './dto/api-response.dto';
import { CreateEventFieldsDto } from './dto/create-event-fields.dto';
import { EventsFilterQueryDto } from './dto/events-filter-query.dto';
import { UpdateEventFieldsDto } from './dto/update-event-fields.dto';
import { EventsService } from './events.service';
import { normalizeEventMultipartBody } from './utils/normalize-event-multipart-body';

const eventUpload = FileFieldsInterceptor(
  [
    { name: 'cover', maxCount: 1 },
    { name: 'photos', maxCount: 24 },
  ],
  { storage: memoryStorage() },
);

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly eventComments: EventCommentsService,
    private readonly cloudinary: CloudinaryService,
    private readonly eventSubscriptions: EventSubscriptionsService,
  ) {}

  private upload = (file: Express.Multer.File, folder: string) =>
    this.cloudinary.upload(file, folder);

  @Get()
  @ApiOperation({ summary: 'Paginated public events with filters' })
  @ApiOkResponse({ type: PaginatedEventsResponseDto })
  async list(
    @Query() query: EventsFilterQueryDto,
  ): Promise<PaginatedEventsResponseDto> {
    return this.eventsService.findFiltered(query);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create a new event (company owner)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Event fields plus optional `cover` (file) and repeated `photos` files.',
    schema: {
      type: 'object',
      required: ['title', 'description', 'format', 'category', 'date'],
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        format: { enum: ['online', 'offline'] },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        date: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        location: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
        price: { type: 'number' },
        currency: { type: 'string' },
        capacity: { type: 'integer' },
        status: { enum: ['draft', 'published'] },
        publishAt: { type: 'string', format: 'date-time' },
        visitorListPrivacy: { enum: ['everybody', 'attendees'] },
        notifyOnNewVisitor: { type: 'boolean' },
        redirectAfterPurchase: { type: 'string' },
        cover: { type: 'string', format: 'binary' },
        photos: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(eventUpload)
  async create(
    @Req() req: { body: Record<string, unknown> },
    @CurrentUser() user: User,
    @UploadedFiles()
    files: { cover?: Express.Multer.File[]; photos?: Express.Multer.File[] },
  ): Promise<EventResponseDto> {
    const dto = plainToInstance(
      CreateEventFieldsDto,
      normalizeEventMultipartBody(req.body),
      { enableImplicitConversion: true },
    );
    const errors = validateSync(dto, {
      forbidUnknownValues: false,
      whitelist: true,
    });
    if (errors.length) {
      throw new BadRequestException(errors);
    }
    return this.eventsService.create(user.id, dto, files ?? {}, this.upload);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update an event (company owner)' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Partial event fields; only sent keys are updated.',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        format: { enum: ['online', 'offline'] },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        date: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        location: { type: 'string' },
        lat: { type: 'number' },
        lng: { type: 'number' },
        price: { type: 'number' },
        currency: { type: 'string' },
        capacity: { type: 'integer' },
        status: { enum: ['draft', 'published'] },
        publishAt: { type: 'string', format: 'date-time' },
        visitorListPrivacy: { enum: ['everybody', 'attendees'] },
        notifyOnNewVisitor: { type: 'boolean' },
        redirectAfterPurchase: { type: 'string' },
        cover: { type: 'string', format: 'binary' },
        photos: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(eventUpload)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: { body: Record<string, unknown> },
    @CurrentUser() user: User,
    @UploadedFiles()
    files: { cover?: Express.Multer.File[]; photos?: Express.Multer.File[] },
  ): Promise<EventResponseDto> {
    const dto = plainToInstance(
      UpdateEventFieldsDto,
      normalizeEventMultipartBody(req.body),
      { enableImplicitConversion: true },
    );
    const errors = validateSync(dto, {
      forbidUnknownValues: false,
      whitelist: true,
      skipMissingProperties: true,
    });
    if (errors.length) {
      throw new BadRequestException(errors);
    }
    return this.eventsService.update(id, user.id, dto, files ?? {}, this.upload);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete event (company owner only)' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiNoContentResponse({ description: 'Event deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiNotFoundResponse({ description: 'Event not found' })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventsService.remove(id, user.id);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar events (same category, excluding this one)' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results (default 4)', example: 4 })
  @ApiOkResponse({ type: [EventResponseDto] })
  async similar(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<EventResponseDto[]> {
    return this.eventsService.findSimilar(id, limit ?? 4);
  }

  @Post(':id/subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiNoContentResponse({ description: 'Booking recorded' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiOperation({
    summary:
      'Book a ticket tier (simulated Stripe payment + notifications). When the event has multiple tiers, pass ticketId.',
  })
  @ApiQuery({
    name: 'ticketId',
    required: false,
    description: 'Admission tier id (required if the event has more than one tier)',
  })
  @ApiQuery({
    name: 'quantity',
    required: false,
    description: 'Number of seats (default 1); cannot exceed tier availability',
  })
  @ApiQuery({
    name: 'hidden',
    required: false,
    description: 'Hide the booking from attendee list and profile (default false)',
  })
  @ApiQuery({
    name: 'promoCode',
    required: false,
    description: 'Promo code to apply a discount',
  })
  async subscribe(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('ticketId', new ParseUUIDPipe({ version: '4', optional: true }))
    ticketId: string | undefined,
    @Query('quantity', new ParseIntPipe({ optional: true })) quantity: number | undefined,
    @Query('hidden') hiddenRaw: string | undefined,
    @Query('promoCode') promoCode: string | undefined,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventsService.subscribe(
      user.id,
      id,
      ticketId,
      quantity ?? 1,
      hiddenRaw === 'true',
      promoCode,
    );
  }

  @Delete(':id/subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Cancel a booking for an event' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiNoContentResponse({ description: 'Booking cancelled' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async unsubscribe(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventsService.unsubscribe(user.id, id);
  }

  @Get(':id/attendees')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Attendee list (respects visitorListPrivacy and profile masking)',
    description: 'If `visitorListPrivacy` is `attendees`, only authenticated bookers can see the list. Hidden bookings are always excluded.',
  })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiOkResponse({ type: [EventAttendeeResponseDto] })
  async attendees(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user?: User,
  ): Promise<EventAttendeeResponseDto[]> {
    return this.eventsService.getAttendees(id, user ?? null);
  }

  @Get(':id/comments')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List comments on an event' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiOkResponse({ type: [EventCommentResponseDto] })
  async comments(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user?: User,
  ): Promise<EventCommentResponseDto[]> {
    return this.eventComments.listComments(id, user ?? null);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Add a comment to an event' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiOkResponse({ type: EventCommentResponseDto })
  async addComment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: AddEventCommentDto,
    @CurrentUser() user: User,
  ): Promise<EventCommentResponseDto> {
    return this.eventComments.addComment(id, user.id, dto);
  }

  @Delete(':id/comments/:commentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete a comment (author or event owner)' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiParam({ name: 'commentId', description: 'Comment UUID', example: 'uuid-here' })
  @ApiNoContentResponse({ description: 'Comment deleted' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async deleteComment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Param('commentId', new ParseUUIDPipe({ version: '4' })) commentId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventComments.deleteComment(eventId, commentId, user.id);
  }

  @Get(':id/tickets')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List ticket tiers for an event with live availability' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiOkResponse({ type: [TicketTierResponseDto] })
  async getTickets(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<TicketTierResponseDto[]> {
    return this.eventsService.getTicketsForEvent(id);
  }

  @Post(':id/tickets')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Add a new ticket tier (owner only)' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'price'],
      properties: {
        name:     { type: 'string', example: 'General Admission' },
        price:    { type: 'number', example: 29.99 },
        currency: { type: 'string', example: 'EUR' },
        capacity: { type: 'integer', nullable: true, example: 200 },
      },
    },
  })
  @ApiOkResponse({ type: TicketTierResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async createTier(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { name: string; price: number; currency?: string; capacity?: number | null },
    @CurrentUser() user: User,
  ): Promise<TicketTierResponseDto> {
    return this.eventsService.addTier(id, user.id, body);
  }

  @Patch(':id/tickets/:tierId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update ticket tier name and/or capacity (owner only)' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiParam({ name: 'tierId', description: 'Ticket tier UUID', example: 'uuid-here' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name:     { type: 'string', example: 'VIP' },
        capacity: { type: 'integer', nullable: true, example: 50 },
      },
    },
  })
  @ApiOkResponse({ type: TicketTierResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async patchTier(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('tierId', new ParseUUIDPipe({ version: '4' })) tierId: string,
    @Body() body: { name?: string; capacity?: number | null },
    @CurrentUser() user: User,
  ): Promise<TicketTierResponseDto> {
    return this.eventsService.updateTier(id, tierId, user.id, body);
  }

  @Post(':id/watch')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Subscribe to event notifications (comments, updates, cancellation)' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiNoContentResponse({ description: 'Now watching' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async watchEvent(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventSubscriptions.subscribe(user.id, id);
  }

  @Delete(':id/watch')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Unsubscribe from event notifications' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiNoContentResponse({ description: 'Unwatched' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async unwatchEvent(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventSubscriptions.unsubscribe(user.id, id);
  }

  @Get(':id/watch')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Check if current user is watching this event' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiOkResponse({ schema: { type: 'object', properties: { watching: { type: 'boolean' } } } })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  async isWatching(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: User,
  ): Promise<{ watching: boolean }> {
    const watching = await this.eventSubscriptions.isSubscribed(user.id, id);
    return { watching };
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get one event by ID (optional auth for isSubscribed)' })
  @ApiParam({ name: 'id', description: 'Event UUID', example: 'a1b2c3d4-e5f6-4789-8012-abcdef012345' })
  @ApiOkResponse({ type: EventResponseDto })
  @ApiNotFoundResponse({ description: 'Event not found' })
  async getOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user?: User,
  ): Promise<EventResponseDto> {
    return this.eventsService.findOneById(id, user ?? null);
  }
}
