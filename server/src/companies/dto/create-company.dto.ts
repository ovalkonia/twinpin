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