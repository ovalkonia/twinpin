import { Company } from '../../companies/entities/company.entity';
import { PromoCode } from '../../promo-codes/entities/promo-code.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EventFormat } from '../enums/event-format.enum';
import { EventStatus } from '../enums/event-status.enum';
import { VisitorListPrivacy } from '../enums/visitor-list-privacy.enum';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 20 })
  format: EventFormat;

  @Column({ type: 'varchar', length: 120 })
  category: string;

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  coverUrl: string | null;

  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  @ManyToOne(() => Company, (company) => company.events, { onDelete: 'CASCADE', eager: false })
  company: Company;

  @OneToMany(() => Ticket, (ticket) => ticket.event)
  tickets: Ticket[];

  @OneToMany(() => PromoCode, (p) => p.event)
  promoCodes: PromoCode[];

  @Column({ type: 'varchar', length: 20 })
  status: EventStatus;

  @Column({ type: 'timestamptz', nullable: true })
  publishAt: Date | null;

  @Column({ type: 'varchar', length: 20, default: VisitorListPrivacy.EVERYBODY })
  visitorListPrivacy: VisitorListPrivacy;

  @Column({ default: false })
  notifyOnNewVisitor: boolean;

  @Column({ type: 'text', nullable: true })
  redirectAfterPurchase: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
