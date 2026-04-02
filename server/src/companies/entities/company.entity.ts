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

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 160, unique: true })
    slug: string;

    @Column({ type: 'varchar', length: 2048, nullable: true })
    logoUrl: string;

    @Column({ type: 'varchar', length: 2048, nullable: true })
    coverUrl: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'simple-array', nullable: true })
    categories: string[];

    @Column({ type: 'varchar', length: 2048, nullable: true })
    website: string;

    @Column({ type: 'varchar', length: 320, nullable: true })
    email: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    address: string;

    @Column({ type: 'varchar', length: 512, nullable: true })
    linkedin: string;

    @Column({ type: 'varchar', length: 512, nullable: true })
    instagram: string;

    @Column({ type: 'varchar', length: 512, nullable: true })
    tiktok: string;

    @Column({ type: 'varchar', length: 512, nullable: true })
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