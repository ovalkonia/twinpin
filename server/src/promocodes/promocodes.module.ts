import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PromocodesService } from './promocodes.service';
import { PromocodesController } from './promocodes.controller';
import { PromoCode } from './entities/promocode.entity';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PromoCode]),
    forwardRef(() => EventsModule), 
  ],
  controllers: [PromocodesController],
  providers: [PromocodesService],
  exports: [PromocodesService],
})
export class PromocodesModule {}