import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('event_comments')
export class EventComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE', eager: false })
  event: Event;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  author: User;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn()
  createdAt: Date;
}
