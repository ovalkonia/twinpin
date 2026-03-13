import { IsString, IsNumber, IsDateString, IsOptional, Min, MaxLength } from 'class-validator';

export class CreateEventDto {
    @IsString()
    @MaxLength(100)
    title: string;

    @IsString()
    description: string;

    @IsDateString()
    date: Date;

    @IsString()
    location: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    poster?: string;

    @IsNumber()
    @Min(1)
    maxTickets: number;

    @IsOptional()
    @IsDateString()
    publishedAt?: Date;

    @IsOptional()
    @IsString()
    redirectUrl?: string;

    @IsString()
    category: string;

    @IsNumber()
    companyId: number;
}