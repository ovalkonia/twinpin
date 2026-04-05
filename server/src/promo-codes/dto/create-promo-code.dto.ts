import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePromoCodeDto {
  @ApiProperty({ example: 'SUMMER25', description: 'Promo code string (1–40 chars)' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code: string;

  @ApiProperty({ example: 20, description: 'Discount amount (percentage or fixed currency units)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiPropertyOptional({
    enum: ['percentage', 'fixed'],
    default: 'percentage',
    description: '`percentage` subtracts discount% from price; `fixed` subtracts the value directly',
  })
  @IsOptional()
  @IsIn(['percentage', 'fixed'])
  discountType?: 'percentage' | 'fixed';

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z', description: 'Expiry date (ISO 8601); omit for no expiry' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ example: 100, description: 'Maximum number of redemptions; omit for unlimited' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUses?: number;
}