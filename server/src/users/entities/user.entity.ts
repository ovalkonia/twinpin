import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column({ select: true })
    password: string;

    @Column({ nullable: true })
    name: string;

    @Column({
        type: "enum",
        enum: ["user", "admin", "organizer"],
        default: "user",
    })
    role: string;

    @OneToMany(() => Company, company => company.owner)
    ownedCompanies: Company[];

    @ManyToMany(() => Company, company => company.members)
    companies: Company[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
