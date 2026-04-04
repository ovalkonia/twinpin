import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventSubscription } from './entities/event-subscription.entity';
import { EventSubscriptionsService } from './event-subscriptions.service';

@Module({
    imports: [TypeOrmModule.forFeature([EventSubscription])],
    providers: [EventSubscriptionsService],
    exports: [EventSubscriptionsService],
})
export class EventSubscriptionsModule {}