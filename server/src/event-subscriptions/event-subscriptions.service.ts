import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { EventSubscription } from './entities/event-subscription.entity';

@Injectable()
export class EventSubscriptionsService {
    constructor(
        @InjectRepository(EventSubscription)
        private readonly repo: Repository<EventSubscription>,
    ) {}

    async subscribe(userId: number, eventId: string): Promise<void> {
        const exists = await this.repo.exist({
            where: { user: { id: userId }, event: { id: eventId } },
        });
        if (exists) return;
        await this.repo.save(
            this.repo.create({
                user: { id: userId } as User,
                event: { id: eventId } as Event,
            }),
        );
    }

    async unsubscribe(userId: number, eventId: string): Promise<void> {
        await this.repo.delete({ user: { id: userId }, event: { id: eventId } });
    }

    async isSubscribed(userId: number, eventId: string): Promise<boolean> {
        return this.repo.exist({
            where: { user: { id: userId }, event: { id: eventId } },
        });
    }

    async getSubscriberIds(eventId: string): Promise<number[]> {
        const rows = await this.repo.find({
            where: { event: { id: eventId } },
            relations: ['user'],
        });
        return rows.map((r) => r.user.id);
    }
}