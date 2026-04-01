import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsString({ message: 'Email must be a valid string' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsString({ message: 'Password must be a valid string' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @IsString({ message: 'Name must be a valid string' })
  @IsOptional()
  name?: string;
}
