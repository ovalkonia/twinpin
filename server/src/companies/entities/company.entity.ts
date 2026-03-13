import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { User } from "../../users/entities/user.entity";


@Entity("companies")
export class Company {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({ unique: true })
    email: string

    @Column()
    location: string

    @ManyToOne(() => User, (user) => user.companies)
    owner: User;

    @Column()
    ownerId: number;
}
