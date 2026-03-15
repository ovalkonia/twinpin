import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('subscriptions')
@Unique(['userId', 'targetType', 'targetId'])
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.subscriptions)
  user: User;

  @Column()
  userId: number;

  @Column({
    type: 'enum',
    enum: ['event', 'company'],
  })
  targetType: 'event' | 'company';

  @Column()
  targetId: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}