import {
    Column,
    CreateDateColumn,
    Entity,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('companies')
export class Company {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    slug: string;

    @Column({ nullable: true })
    logoUrl: string;

    @Column({ nullable: true })
    coverUrl: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'simple-array', nullable: true })
    categories: string[];

    @Column({ nullable: true })
    website: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    linkedin: string;

    @Column({ nullable: true })
    instagram: string;

    @Column({ nullable: true })
    tiktok: string;

    @Column({ nullable: true })
    telegram: string;

    @ManyToOne(() => User, user => user.ownedCompanies, { eager: false })
    owner: User;

    @ManyToMany(() => User, user => user.companies, { eager: false })
    @JoinTable({ name: 'company_members' })
    members: User[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}