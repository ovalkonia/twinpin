import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  async subscribe(userId: number, targetType: 'event' | 'company', targetId: number) {
    const existing = await this.subscriptionsRepository.findOne({
      where: { userId, targetType, targetId },
    })

    if (existing) {
      return { error: 'Already subscribed' }
    }

    const subscription = this.subscriptionsRepository.create({
      userId,
      targetType,
      targetId,
    })

    return await this.subscriptionsRepository.save(subscription)
  }

  async unsubscribe(userId: number, targetType: 'event' | 'company', targetId: number) {
    const result = await this.subscriptionsRepository.delete({
      userId,
      targetType,
      targetId,
    })

    if (result.affected === 0) {
      return { error: 'Subscription not found' }
    }

    return { message: 'Unsubscribed successfully' }
  }

  async isSubscribed(userId: number, targetType: 'event' | 'company', targetId: number) {
    const count = await this.subscriptionsRepository.count({
      where: { userId, targetType, targetId },
    });
    return count > 0
  }

  async getSubscribers(targetType: 'event' | 'company', targetId: number) {
    return await this.subscriptionsRepository.find({
      where: { targetType, targetId },
      relations: ['user'],
    })
  }

  async getUserSubscriptions(userId: number) {
    return await this.subscriptionsRepository.find({
      where: { userId },
    })
  }
}