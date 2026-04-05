import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EventFormat } from '../enums/event-format.enum';
import { EventStatus } from '../enums/event-status.enum';
import { VisitorListPrivacy } from '../enums/visitor-list-privacy.enum';

export class TicketTierDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ default: 'EUR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity: number;
}

export class CreateEventFieldsDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50_000)
  description: string;

  @ApiProperty({ enum: EventFormat })
  @IsEnum(EventFormat)
  format: EventFormat;

  @ApiProperty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString()
  @MaxLength(120)
  category: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ default: 'EUR' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ enum: [EventStatus.DRAFT, EventStatus.PUBLISHED] })
  @IsOptional()
  @IsIn([EventStatus.DRAFT, EventStatus.PUBLISHED])
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'When set, the event becomes visible in public listings at this time (if status is published).',
  })
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ApiPropertyOptional({ enum: VisitorListPrivacy })
  @IsOptional()
  @IsEnum(VisitorListPrivacy)
  visitorListPrivacy?: VisitorListPrivacy;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value, obj, key }) => {
    // Read the original source value to bypass enableImplicitConversion,
    // which converts 'false' → Boolean('false') = true before @Transform runs.
    const raw = (obj as Record<string, unknown>)[key as string] ?? value;
    if (raw === true || raw === 'true') return true;
    if (raw === false || raw === 'false') return false;
    return undefined;
  })
  @IsBoolean()
  notifyOnNewVisitor?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  redirectAfterPurchase?: string;

  @ApiPropertyOptional({
    type: [TicketTierDto],
    description:
      'Optional custom ticket tiers. The first tier is treated as the default tier for bookings.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TicketTierDto)
  tickets?: TicketTierDto[];
}
