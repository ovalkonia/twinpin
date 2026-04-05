import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCompanyDto {
    @ApiProperty({ example: 'Acme Events', description: 'Company display name' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'acme-events', description: 'URL-safe unique slug' })
    @IsString()
    slug: string;

    @ApiProperty({ example: 'We organise tech conferences across Europe.', description: 'Company description' })
    @IsString()
    @MinLength(1)
    description: string;

    @ApiPropertyOptional({ example: ['tech', 'music'], description: 'Event category tags' })
    @IsOptional()
    @Transform(({ value }) => {
        if (!Array.isArray(value)) return value;
        return value.map((c: string) => (typeof c === 'string' ? c.trim().toLowerCase() : c));
    })
    @IsArray()
    @IsString({ each: true })
    categories?: string[];

    @ApiPropertyOptional({ example: 'https://acme.io' })
    @IsOptional()
    @IsString()
    website?: string;

    @ApiPropertyOptional({ example: 'info@acme.io' })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({ example: '123 Main St, Berlin' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({ example: 'https://linkedin.com/company/acme' })
    @IsOptional()
    @IsString()
    linkedin?: string;

    @ApiPropertyOptional({ example: '@acme_events' })
    @IsOptional()
    @IsString()
    instagram?: string;

    @ApiPropertyOptional({ example: '@acme' })
    @IsOptional()
    @IsString()
    tiktok?: string;

    @ApiPropertyOptional({ example: 't.me/acmeevents' })
    @IsOptional()
    @IsString()
    telegram?: string;
}