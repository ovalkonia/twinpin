import { User } from '../../users/entities/user.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/** A user's purchase of a specific event ticket tier. */
@Entity('bookings')
@Unique(['user', 'ticket'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
  user: User;

  @ManyToOne(() => Ticket, (ticket) => ticket.bookings, { onDelete: 'CASCADE', eager: false })
  ticket: Ticket;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  stripePaymentIntentId: string | null;

  @Column({ type: 'varchar', length: 32, default: 'completed' })
  paymentStatus: string;

  @Column({ default: false })
  hidden: boolean;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: true })
  ticketCode: string | null;

  @Column({ type: 'timestamptz', nullable: true, default: null })
  usedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
