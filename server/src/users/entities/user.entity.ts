import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 320, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 255, select: true })
    password: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    name: string;

    @Column({ type: 'varchar', length: 2048, nullable: true })
    avatarUrl: string;

    @Column({ type: 'boolean', default: true })
    profilePublic: boolean;

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
