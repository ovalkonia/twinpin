import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm';
import { Event } from '../../events/entities/event.entity';

@Entity('promocodes')
@Unique(['code', 'eventId']) 
export class PromoCode {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  code: string

  @Column({ type: 'decimal' })
  discount: number

  @Column({
    type: 'enum',
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  })
  discountType: string

  @ManyToOne(() => Event, (event) => event.promocodes)
  event: Event

  @Column()
  eventId: number

  @Column({ type: 'timestamp', nullable: true })
  validUntil: Date

  @Column({ default: 1 })
  maxUses: number

  @Column({ default: 0 })
  usedCount: number

  @Column({ default: true })
  isActive: boolean
}