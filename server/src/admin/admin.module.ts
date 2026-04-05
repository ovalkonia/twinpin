// AdminJS is initialized in main.ts to ensure its Express middleware is
// registered before NestJS's not-found handler. Nothing to declare here.
import { Module } from '@nestjs/common';

@Module({})
export class AdminModule {}
