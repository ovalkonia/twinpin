import { Injectable } from '@nestjs/common';
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
    const existingUser  = await this.usersService.findByEmail(registerDto.email)
    if (existingUser) return {error: "we already have account with this email"}
    const newUser = await this.usersService.create(registerDto)
    const payload = { sub: newUser.id, email: newUser.email }
    const token = await this.jwtService.signAsync(payload)

    const { passwordHash, ...userWithoutPassword } = newUser

    return {
      access_token: token,
      user: userWithoutPassword
    };
  }


  async login(loginDto: LoginDto) {
    const existingUser  = await this.usersService.findByEmail(loginDto.email)
    if (!existingUser) return {error: "unfortunately we dont have account with this email"}

    if (!await bcrypt.compare(loginDto.password, existingUser.passwordHash)) return {error: "wrong password"}

    const payload = { sub: existingUser.id, email: existingUser.email }
    const token = await this.jwtService.signAsync(payload)

    const { passwordHash, ...userWithoutPassword } = existingUser

    return {
      access_token: token,
      user: userWithoutPassword
    }
  }

}
