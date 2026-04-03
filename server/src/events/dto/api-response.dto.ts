import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TicketTierResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() price: number;
  @ApiProperty() currency: string;
  @ApiPropertyOptional({ nullable: true }) availableSpots: number | null;
  @ApiProperty() isDefault: boolean;
  @ApiProperty() sortOrder: number;
}

export class EventAttendeeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty({ description: 'False when the attendee has a private profile.' })
  profileVisible: boolean;
}

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ['online', 'offline'] })
  format: 'online' | 'offline';

  @ApiProperty()
  category: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiProperty()
  date: string;

  @ApiPropertyOptional()
  endDate?: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  lat?: number;

  @ApiPropertyOptional()
  lng?: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  capacity?: number;

  @ApiProperty()
  attendeeCount: number;

  @ApiPropertyOptional()
  coverUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  photos?: string[];

  @ApiProperty({ description: 'Company owner user id as string (organizer).' })
  organizerId: string;

  @ApiProperty()
  organizerName: string;

  @ApiPropertyOptional()
  organizerSlug?: string;

  @ApiPropertyOptional()
  organizerLogoUrl?: string;

  @ApiProperty({ enum: ['draft', 'published', 'cancelled'] })
  status: 'draft' | 'published' | 'cancelled';

  @ApiPropertyOptional()
  isSubscribed?: boolean;
}

export class PaginatedEventsResponseDto {
  @ApiProperty({ type: [EventResponseDto] })
  data: EventResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class EventCommentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  authorName: string;

  @ApiPropertyOptional()
  authorAvatarUrl?: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  createdAt: string;
}
