import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from "../users/users.service";
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor (
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const newUser = await this.usersService.create(registerDto);
    const { password, ...user } = newUser;

    return { user };
  }

  async login(loginDto: LoginDto) {
    const existingUser  = await this.usersService.findByEmail(loginDto.email);
    console.log(existingUser);
    if (!existingUser || !await bcrypt.compare(loginDto.password, existingUser.password)) {
      throw new UnauthorizedException("Invalid credentials!");
    }

    const access_token = this.jwtService.sign({
        sub: existingUser.id,
        email: existingUser.email,
    });

    const { password, ...user } = existingUser;

    return {
      access_token,
      user,
    }
  }
}
