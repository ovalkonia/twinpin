import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Event } from '../events/entities/event.entity';
import { Ticket } from '../tickets/entities/ticket.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

export type PublicUser = Omit<User, 'password'> & { id: string };

export type UserEventRow = {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  price: string;
  coverUrl?: string;
  attendeeCount: number;
  capacity: number | null;
};

export type UserTicketRow = {
  id: string;
  title: string;
  category: string;
  date: string;
  location: string;
  ticketCount: number;
  price: string;
  currency: string;
  coverUrl: string | null;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    @InjectRepository(Ticket)
    private readonly ticketRepo: Repository<Ticket>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, name } = createUserDto;

    const existingUser = await this.usersRepository.findOneBy({ email });
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const newUser = this.usersRepository.create({
      email,
      password: await bcrypt.hash(password, 10),
      name,
    });

    return await this.usersRepository.save(newUser);
  }

  async findAll(): Promise<PublicUser[]> {
    const users = await this.usersRepository.find({
      select: [
        'id',
        'email',
        'name',
        'avatarUrl',
        'profilePublic',
        'role',
        'created_at',
        'updated_at',
      ],
    });
    return users.map((u) => this.toPublicUser(u as User));
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findOnePublic(id: number): Promise<PublicUser> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'name',
        'avatarUrl',
        'profilePublic',
        'role',
        'created_at',
        'updated_at',
      ],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.toPublicUser(user);
  }

  toPublicUser(user: User): PublicUser {
    const { password: _p, ...rest } = user;
    return { ...rest, id: String(rest.id) } as PublicUser;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);

    return await this.usersRepository.save(user);
  }

  async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    const user = await this.findOne(id);
    user.avatarUrl = avatarUrl;
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOneBy({ email });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  private async minTicketPriceByEventIds(
    eventIds: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (!eventIds.length) return map;
    const rows = await this.ticketRepo
      .createQueryBuilder('t')
      .select('t.eventId', 'eventId')
      .addSelect('MIN(t.price)', 'minp')
      .where('t.eventId IN (:...ids)', { ids: eventIds })
      .groupBy('t.eventId')
      .getRawMany<{ eventId: string; minp: string }>();
    for (const r of rows) {
      map.set(r.eventId, r.minp);
    }
    return map;
  }

  /** Events owned by this user's company (organizer). */
  async listEventsForUser(userId: number): Promise<UserEventRow[]> {
    const events = await this.eventRepo
      .createQueryBuilder('e')
      .innerJoin('e.company', 'c')
      .innerJoin('c.owner', 'owner')
      .where('owner.id = :uid', { uid: userId })
      .orderBy('e.date', 'DESC')
      .getMany();

    const ids = events.map((e) => e.id);
    const prices = await this.minTicketPriceByEventIds(ids);

    // Attendee counts per event (sum of booking quantities)
    const attendeeRows: { eventId: string; total: string }[] = ids.length
      ? await this.bookingRepo
          .createQueryBuilder('b')
          .innerJoin('b.ticket', 't')
          .select('t.eventId', 'eventId')
          .addSelect('SUM(b.quantity)', 'total')
          .where('t.eventId IN (:...ids)', { ids })
          .groupBy('t.eventId')
          .getRawMany()
      : [];
    const attendeeMap = new Map(attendeeRows.map((r) => [r.eventId, Number(r.total)]));

    // Default ticket capacity per event
    const defaultTickets = ids.length
      ? await this.ticketRepo.find({
          where: ids.map((id) => ({ event: { id }, isDefault: true as const })),
          relations: ['event'],
        })
      : [];
    const capacityMap = new Map(
      defaultTickets.map((t) => [t.event.id, t.quantityAvailable]),
    );

    return events.map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      date: e.date.toISOString(),
      location: e.location ?? '',
      price: prices.get(e.id) ?? '0',
      coverUrl: e.coverUrl ?? undefined,
      attendeeCount: attendeeMap.get(e.id) ?? 0,
      capacity: capacityMap.get(e.id) ?? null,
    }));
  }

  /** Bookings for this user, grouped by event. */
  async listTicketsForUser(userId: number): Promise<UserTicketRow[]> {
    const bookings = await this.bookingRepo.find({
      where: { user: { id: userId } },
      relations: ['ticket', 'ticket.event'],
      order: { createdAt: 'DESC' },
    });

    const byEvent = new Map<
      string,
      {
        event: Event;
        count: number;
        minPrice: number;
        currency: string;
      }
    >();

    for (const b of bookings) {
      const ev = b.ticket.event;
      const prev = byEvent.get(ev.id);
      const add = b.quantity ?? 1;
      const price = Number(b.ticket.price);
      const currency = b.ticket.currency;
      if (prev) {
        prev.count += add;
        if (price < prev.minPrice) {
          prev.minPrice = price;
          prev.currency = currency;
        }
      } else {
        byEvent.set(ev.id, {
          event: ev,
          count: add,
          minPrice: price,
          currency,
        });
      }
    }

    return [...byEvent.values()].map(({ event: e, count, minPrice, currency }) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      date: e.date.toISOString(),
      location: e.location ?? '',
      ticketCount: count,
      price: String(minPrice),
      currency,
      coverUrl: e.coverUrl ?? null,
    }));
  }
}
