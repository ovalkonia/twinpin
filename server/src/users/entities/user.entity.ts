import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column({ select: false })
    password: string;

    @Column({ nullable: true })
    name: string;

    @Column({
        type: "enum",
        enum: ["user", "admin", "organizer"],
        default: "user",
    })
    role: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
