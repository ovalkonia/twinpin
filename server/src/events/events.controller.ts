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
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EventCommentsService } from '../event-comments/event-comments.service';
import { User } from '../users/entities/user.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AddEventCommentDto } from './dto/add-event-comment.dto';
import {
  EventCommentResponseDto,
  EventAttendeeResponseDto,
  EventResponseDto,
  PaginatedEventsResponseDto,
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
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Event fields plus optional `cover` (file) and repeated `photos` files.',
    schema: {
      type: 'object',
      required: ['title', 'description', 'format', 'category', 'date', 'price'],
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
  @ApiBearerAuth()
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event (company owner only)' })
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventsService.remove(id, user.id);
  }

  @Get(':id/similar')
  @ApiOkResponse({ type: [EventResponseDto] })
  async similar(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<EventResponseDto[]> {
    return this.eventsService.findSimilar(id, limit ?? 4);
  }

  @Post(':id/subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
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
  async subscribe(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('ticketId', new ParseUUIDPipe({ version: '4', optional: true }))
    ticketId: string | undefined,
    @Query('quantity', new ParseIntPipe({ optional: true })) quantity: number | undefined,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventsService.subscribe(
      user.id,
      id,
      ticketId,
      quantity ?? 1,
    );
  }

  @Delete(':id/subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
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
  })
  @ApiOkResponse({ type: [EventAttendeeResponseDto] })
  async attendees(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user?: User,
  ): Promise<EventAttendeeResponseDto[]> {
    return this.eventsService.getAttendees(id, user ?? null);
  }

  @Get(':id/comments')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOkResponse({ type: [EventCommentResponseDto] })
  async comments(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user?: User,
  ): Promise<EventCommentResponseDto[]> {
    return this.eventComments.listComments(id, user ?? null);
  }

  @Post(':id/comments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
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
  @ApiBearerAuth()
  async deleteComment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Param('commentId', new ParseUUIDPipe({ version: '4' })) commentId: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.eventComments.deleteComment(eventId, commentId, user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get one event (optional auth for isSubscribed)' })
  @ApiOkResponse({ type: EventResponseDto })
  async getOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user?: User,
  ): Promise<EventResponseDto> {
    return this.eventsService.findOneById(id, user ?? null);
  }
}
