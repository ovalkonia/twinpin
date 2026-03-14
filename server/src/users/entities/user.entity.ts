import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { Company } from '../../companies/entities/company.entity'

import { Ticket } from 'src/tickets/entities/ticket.entity'

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    email: string

    @Column()
    passwordHash: string

    @Column()
    fullName: string

    @Column({
        type: "enum",
        enum: ["user", "admin", "organizer"],
        default: "user"
    })
    role: string

    @Column({ default: true })
    isVisibleInVisitorList: boolean

    @OneToMany(() => Company, (company) => company.owner)
    companies: Company[] 

    @OneToMany(() => Ticket, (ticket) => ticket.user)
    tickets: Ticket[];
}
