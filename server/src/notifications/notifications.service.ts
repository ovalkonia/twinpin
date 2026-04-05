import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { MailService } from '../mail/mail.service';

export type ApiNotification = {
  id: string;
  type: string;
  message: string;
  date: string;
  read: boolean;
  category: 'event' | 'ticket' | 'system';
  title: string;
};

// Types that already have their own dedicated email — skip generic notification email for these.
const SKIP_EMAIL_TYPES = new Set(['event_booking', 'ticket_cancellation', 'company_new_event']);

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly mail: MailService,
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

    if (!SKIP_EMAIL_TYPES.has(type)) {
      const user = await this.notificationRepo.manager.findOne(User, { where: { id: userId } });
      if (user?.email) {
        const title = type
          .split('_')
          .map(s => s.charAt(0).toUpperCase() + s.slice(1))
          .join(' ');
        void this.mail.sendNotificationEmail(user.email, title, message, type);
      }
    }

    return saved;
  }

  private toApi(n: Notification): ApiNotification {
    const category =
      n.type.startsWith('event_')
        ? 'event'
        : n.type.startsWith('ticket_')
          ? 'ticket'
          : 'system';

    const title = n.type
      .split('_')
      .slice(0, 3)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');

    return {
      id: n.id,
      type: n.type,
      message: n.message,
      date: n.createdAt.toISOString(),
      read: n.read,
      category,
      title,
    };
  }

  async listForUser(userId: number): Promise<ApiNotification[]> {
    const rows = await this.notificationRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
    return rows.map((n) => this.toApi(n));
  }

  async markRead(userId: number, notificationId: string): Promise<ApiNotification> {
    const row = await this.notificationRepo.findOne({
      where: { id: notificationId, user: { id: userId } },
    });
    if (!row) throw new NotFoundException('Notification not found');
    row.read = true;
    const saved = await this.notificationRepo.save(row);
    return this.toApi(saved);
  }

  async markAllRead(userId: number): Promise<void> {
    await this.notificationRepo.update(
      { user: { id: userId } as any, read: false },
      { read: true },
    );
  }

  async deleteForUser(userId: number, notificationId: string): Promise<void> {
    const res = await this.notificationRepo.delete({
      id: notificationId,
      user: { id: userId } as any,
    } as any);
    if (!res.affected) throw new NotFoundException('Notification not found');
  }
}

