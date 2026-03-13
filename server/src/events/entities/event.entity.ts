import { Column, PrimaryGeneratedColumn, Entity, ManyToOne } from "typeorm";
import { Company } from '../../companies/entities/company.entity';

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
}
