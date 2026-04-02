import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async notifyUser(
    userId: number,
    type: string,
    message: string,
  ): Promise<Notification> {
    const row = this.notificationRepo.create({
      user: { id: userId } as User,
      type,
      message,
    });
    const saved = await this.notificationRepo.save(row);
    this.logger.log(`Notification [${type}] for user ${userId}: ${message}`);
    return saved;
  }
}
