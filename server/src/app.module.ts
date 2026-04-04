import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { repairLegacyUserRows } from './database/repair-legacy-user-rows';
import { AuthModule } from './auth/auth.module';
import { Booking } from './bookings/entities/booking.entity';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { CompaniesModule } from './companies/companies.module';
import { Company } from './companies/entities/company.entity';
import { EventComment } from './event-comments/entities/event-comment.entity';
import { Event } from './events/entities/event.entity';
import { EventsModule } from './events/events.module';
import { Notification } from './notifications/entities/notification.entity';
import { OrganizerFollow } from './organizer-follows/entities/organizer-follow.entity';
import { OrganizerFollowsModule } from './organizer-follows/organizer-follows.module';
import { EventSubscription } from './event-subscriptions/entities/event-subscription.entity';
import { EventSubscriptionsModule } from './event-subscriptions/event-subscriptions.module';
import { CompanyFollow } from './company-follows/entities/company-follow.entity';
import { CompanyFollowsModule } from './company-follows/company-follows.module';
import { PromoCode } from './promo-codes/entities/promo-code.entity';
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { Ticket } from './tickets/entities/ticket.entity';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        await repairLegacyUserRows({
          host: configService.getOrThrow<string>('DB_HOST'),
          port: configService.getOrThrow<number>('DB_PORT'),
          user: configService.getOrThrow<string>('POSTGRES_USER'),
          password: configService.getOrThrow<string>('POSTGRES_PASSWORD'),
          database: configService.getOrThrow<string>('POSTGRES_DB'),
        });

        return {
          type: 'postgres' as const,
          host: configService.getOrThrow<string>('DB_HOST'),
          port: configService.getOrThrow<number>('DB_PORT'),
          username: configService.getOrThrow<string>('POSTGRES_USER'),
          password: configService.getOrThrow<string>('POSTGRES_PASSWORD'),
          database: configService.getOrThrow<string>('POSTGRES_DB'),
          entities: [
            User,
            Company,
            Event,
            Ticket,
            Booking,
            EventComment,
            OrganizerFollow,
            Notification,
            PromoCode,
            EventSubscription,
            CompanyFollow,
          ],
          synchronize: true,
        };
      },
    }),
    UsersModule,
    AuthModule,
    CloudinaryModule,
    CompaniesModule,
    OrganizerFollowsModule,
    EventSubscriptionsModule,
    CompanyFollowsModule,
    EventsModule,
    PromoCodesModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
