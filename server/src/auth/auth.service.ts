import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
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

  async googleLogin(googleUser: any) {
    const email = googleUser?.email;
    if (!email) {
      throw new UnauthorizedException('Google account email is missing');
    }

    let user: any;
    try {
      user = await this.usersService.findByEmail(email);
    } catch {
      user = null;
    }

    if (!user) {
      user = await this.usersService.create({
        email,
        password: randomBytes(16).toString('hex'),
        name: [googleUser?.firstName, googleUser?.lastName].filter(Boolean).join(' ') || undefined,
      });
    }

    if (!user?.id) {
      throw new UnauthorizedException('Unable to authenticate Google user');
    }

    const access_token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      access_token,
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
