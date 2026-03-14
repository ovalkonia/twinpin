import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(userId: number, type: string, message: string, data?: any) {
    const notification = this.notificationsRepository.create({
      user: { id: userId },
      type,
      message,
      data,
    });
    return await this.notificationsRepository.save(notification);
  }

  async findByUser(userId: number) {
    return await this.notificationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number, userId: number) {
    await this.notificationsRepository.update(
      { id, user: { id: userId } },
      { isRead: true }
    );
  }

  async findUnreadByUser(userId: number) {
    return await this.notificationsRepository.find({
      where: { user: { id: userId }, isRead: false },
    });
  }
}