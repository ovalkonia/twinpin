import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiExcludeEndpoint,
  ApiFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

class AuthUserDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Alice Smith' })
  name: string;

  @ApiProperty({ example: 'alice@example.com' })
  email: string;
}

class AuthResponseDto {
  @ApiProperty({ description: 'JWT bearer token — include as `Authorization: Bearer <token>`' })
  access_token: string;

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
) {}

  @Post('/register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'Account created — returns JWT and user profile', type: AuthResponseDto })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Login successful — returns JWT and user profile', type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
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
  @ApiOperation({
    summary: 'Initiate Google OAuth2 sign-in',
    description:
      'Redirects the browser to Google consent screen. Not callable directly from Swagger — open this URL in a browser tab.',
  })
  @ApiFoundResponse({ description: 'Redirects to Google OAuth2 consent page' })
  async googleAuth() {}

  @Get('/google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiExcludeEndpoint()
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