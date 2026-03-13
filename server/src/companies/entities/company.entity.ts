import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany } from "typeorm";
import { User } from "../../users/entities/user.entity";
import { Event } from "../../events/entities/event.entity";


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

    @OneToMany(() => Event, (event) => event.company)
    events: Event[];
}
