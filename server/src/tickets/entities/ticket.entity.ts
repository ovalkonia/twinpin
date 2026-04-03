import { Event } from '../../events/entities/event.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

/** Admission tier / plan owned by an event (price & inventory cap). */
@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, (event) => event.tickets, { onDelete: 'CASCADE', eager: false })
  event: Event;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: string;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  /**
   * Max number of seats (sum of booking quantities) for this tier.
   * null = no limit for this tier.
   */
  @Column({ type: 'int', nullable: true })
  quantityAvailable: number | null;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  /** Tier synced from the main event create/update form (single primary tier). */
  @Column({ default: false })
  isDefault: boolean;

  @OneToMany(() => Booking, (booking) => booking.ticket)
  bookings: Booking[];
}
