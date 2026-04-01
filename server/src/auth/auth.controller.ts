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

  @Post('/register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Res({ passthrough: true }) res: any,
    @Body() loginDto: LoginDto
  ) {
    const data = await this.authService.login(loginDto);
    res.cookie('access_token', data.access_token, {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
        sameSite: 'strict',
        httpOnly: true,
    });
    return data;
  }

  @Get('/google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    const frontendUrl = this.configService.getOrThrow<string>('URL_FRONTEND');

    if (!req.user) {
      return res.redirect(`${frontendUrl}/auth/sign-in?error=no_user`);
    }

    const { access_token, user } = await this.authService.googleLogin(req.user);

    const params = new URLSearchParams({
      token: access_token,
      id: String(user.id),
      name: user.name || '',
      email: user.email,
    });

    return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
  }
}
