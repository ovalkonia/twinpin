import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

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
}
