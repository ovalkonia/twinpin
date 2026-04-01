import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      // Callback lands back on `/auth/google` (single route).
      callbackURL: `${configService.getOrThrow<string>('URL_BACKEND')}/auth/google`,
      scope: ['email', 'profile'],
      // Keep it simple: no offline/refresh token flow.
      accessType: 'online',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, id } = profile ?? {};
    const email = emails?.[0]?.value;

    const user = {
      googleId: id,
      email,
      firstName: name?.givenName,
      lastName: name?.familyName,
    };

    done(null, user);
  }
}
