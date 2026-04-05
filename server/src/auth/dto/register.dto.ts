import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'alice@example.com', description: 'Email address (must be unique)' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsString({ message: 'Email must be a valid string' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'secureP@ss1', description: 'Password — minimum 8 characters' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsString({ message: 'Password must be a valid string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @ApiPropertyOptional({ example: 'Alice Smith', description: 'Display name' })
  @IsString({ message: 'Name must be a valid string' })
  @IsOptional()
  name?: string;
}