import { Column, PrimaryGeneratedColumn, Entity, ManyToOne, OneToMany } from "typeorm";
import { Company } from '../../companies/entities/company.entity';

import { Ticket } from "src/tickets/entities/ticket.entity";
import { Comment } from 'src/comments/entities/comment.entity'
import { PromoCode } from "src/promocodes/entities/promocode.entity";


@Entity('events')
export class Event {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column({ nullable: true })
    date: Date

    @Column()
    location: string

    @Column({ type: 'decimal' })
    price: number

    @Column({ default: 'USD' })
    currency: string

    @Column({ nullable: true })
    poster: string

    @Column()
    maxTickets: number

    @Column({ nullable: true })
    publishedAt: Date

    @Column({ nullable: true })
    redirectUrl: string

    @Column({
    type: 'enum',
    enum: ['concert', 'sports', 'workshop', 'conference', 'other'],
    default: 'other'
    })
    category: string

    @ManyToOne(() => Company, (company) => company.events)
    company: Company

    @Column()
    companyId: number

    @OneToMany(() => Ticket, (ticket) => ticket.event)
    tickets: Ticket[]

    @OneToMany(() => Comment, (comment) => comment.event)
    comments: Comment[]

    @OneToMany(() => PromoCode, (promo) => promo.event)
    promocodes: PromoCode[]
}
