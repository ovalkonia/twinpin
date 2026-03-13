import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

import { User } from './users/entities/user.entity';
import { Company } from './companies/entities/company.entity';

import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { EventsModule } from './events/events.module';
import { Event } from './events/entities/event.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '23451',
      database: 'postgres',
      entities: [User, Company, Event],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    CompaniesModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}