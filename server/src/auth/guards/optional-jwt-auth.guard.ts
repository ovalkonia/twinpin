import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const raw = req.headers.authorization;
    if (!raw?.startsWith('Bearer ')) {
      return true;
    }
    const token = raw.slice(7);
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: number }>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      if (payload?.sub != null) {
        try {
          req.user = await this.usersService.findOne(payload.sub);
        } catch {
          req.user = undefined;
        }
      }
    } catch {
      req.user = undefined;
    }
    return true;
  }
}
