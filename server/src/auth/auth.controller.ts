import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
) {}

  @Post("/register")
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("/login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Res() res: any,
    @Body() loginDto: LoginDto
  ) {
    const data = await this.authService.login(loginDto);
    res.cookie('access_token', data.access_token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        sameSimte: 'strict',
        httpOnly: true,
    });
    return data;
  }

  @Get('/google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(
    @Req() req: any,
    @Res() res: any,
) {
    if (!req?.user) return;
    const { access_token } = await this.authService.googleLogin(req.user);
    res.cookie('access_token', access_token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        sameSimte: 'strict',
        httpOnly: true,
    });
    return res.redirect(`${this.configService.getOrThrow<string>('URL_FRONTEND')}`);
  }
}
