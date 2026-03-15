import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm'
import { Company } from '../../companies/entities/company.entity'

import { Ticket } from 'src/tickets/entities/ticket.entity'
import { Notification } from 'src/notifications/entities/notification.entity'
import { Comment } from 'src/comments/entities/comment.entity'

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

    @OneToMany(() => Notification, (notification) => notification.user)
    notifications: Notification[];

    @OneToMany(() => Comment, (comment) => comment.user)
    comments: Comment[];
}
