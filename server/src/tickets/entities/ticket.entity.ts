import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

@Entity('tickets')
export class Ticket {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true, type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    purchaseDate: Date

    @Column({
        type: "enum",
        enum: ["registered", "paid", "cancelled"],
        default: "registered",
    })
    status: string

    @Column({ nullable: true })
    promoCode: string

    @Column({ unique: true })
    ticketNumber: string

    @ManyToOne(() => User, (user) => user.tickets)
    user: User

    @Column()
    userId: number

    @ManyToOne(() => Event, (event) => event.tickets)
    event: Event

    @Column()
    eventId: number
}
