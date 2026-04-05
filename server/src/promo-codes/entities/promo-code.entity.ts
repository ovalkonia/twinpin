import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';

@Entity('promo_codes')
@Unique(['code', 'event'])
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40 })
  code: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discount: number;

  @Column({ type: 'varchar', length: 20, default: 'percentage' })
  discountType: 'percentage' | 'fixed';

  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  @Column({ default: 1 })
  maxUses: number;

  @Column({ default: 0 })
  usedCount: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Event, (event) => event.promoCodes, { onDelete: 'CASCADE' })
  event: Event;
}