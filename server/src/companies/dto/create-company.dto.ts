import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCompanyDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;

    @IsString()
    @MinLength(1)
    description: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (!Array.isArray(value)) return value;
        return value.map((c: string) => (typeof c === 'string' ? c.trim().toLowerCase() : c));
    })
    @IsArray()
    @IsString({ each: true })
    categories?: string[];

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    linkedin?: string;

    @IsOptional()
    @IsString()
    instagram?: string;

    @IsOptional()
    @IsString()
    tiktok?: string;

    @IsOptional()
    @IsString()
    telegram?: string;
}