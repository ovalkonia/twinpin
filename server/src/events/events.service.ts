import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { BookingsService } from '../bookings/bookings.service';
import { CompaniesService } from '../companies/companies.service';
import { TicketsService } from '../tickets/tickets.service';
import { UsersService } from '../users/users.service';
import { EventSubscriptionsService } from '../event-subscriptions/event-subscriptions.service';
import { CompanyFollowsService } from '../company-follows/company-follows.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { User } from '../users/entities/user.entity';
import {
  EventAttendeeResponseDto,
  EventResponseDto,
  PaginatedEventsResponseDto,
  TicketTierResponseDto,
} from './dto/api-response.dto';
import { CreateEventFieldsDto } from './dto/create-event-fields.dto';
import { EventsFilterQueryDto } from './dto/events-filter-query.dto';
import { UpdateEventFieldsDto } from './dto/update-event-fields.dto';
import { Event } from './entities/event.entity';
import { EventStatus } from './enums/event-status.enum';
import { VisitorListPrivacy } from './enums/visitor-list-privacy.enum';
import { Ticket } from '../tickets/entities/ticket.entity';

const EVENT_RELATIONS = ['company', 'company.owner'] as const;

type EventListMetrics = {
  attendeeCount: number;
  minPrice: number;
  currency: string;
  capacity?: number;
};

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
    private readonly ticketsService: TicketsService,
    private readonly bookingsService: BookingsService,
    private readonly companiesService: CompaniesService,
    private readonly eventSubscriptions: EventSubscriptionsService,
    private readonly companyFollows: CompanyFollowsService,
    private readonly notifications: NotificationsService,
    private readonly promoCodes: PromoCodesService,
    private readonly usersService: UsersService,
  ) {}

  private now(): Date {
    return new Date();
  }

  private isPubliclyVisible(event: Event, at: Date): boolean {
    if (event.status !== EventStatus.PUBLISHED) return false;
    if (event.publishAt && event.publishAt > at) return false;
    return true;
  }

  private assertUserOwnsEventCompany(userId: number, event: Event): void {
    if (event.company.owner.id !== userId) {
      throw new ForbiddenException('Only the owning company can manage this event');
    }
  }

  private toEventDto(
    event: Event,
    metrics: EventListMetrics,
    isSubscribed?: boolean,
  ): EventResponseDto {
    const company = event.company;
    const owner = company.owner;
    const photos = event.photos?.filter(Boolean);
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      format: event.format as EventResponseDto['format'],
      category: event.category,
      tags: event.tags ?? [],
      date: event.date.toISOString(),
      endDate: event.endDate ? event.endDate.toISOString() : undefined,
      location: event.location ?? undefined,
      lat: event.lat != null ? Number(event.lat) : undefined,
      lng: event.lng != null ? Number(event.lng) : undefined,
      price: metrics.minPrice,
      currency: metrics.currency,
      capacity: metrics.capacity,
      attendeeCount: metrics.attendeeCount,
      coverUrl: event.coverUrl ?? undefined,
      photos: photos?.length ? photos : undefined,
      organizerId: String(owner.id),
      organizerCompanyId: String(company.id),
      organizerName: company.name,
      organizerSlug: company.slug ?? undefined,
      organizerLogoUrl: company.logoUrl ?? undefined,
      status: event.status as EventResponseDto['status'],
      redirectAfterPurchase: event.redirectAfterPurchase ?? null,
      ...(isSubscribed !== undefined ? { isSubscribed } : {}),
    };
  }

  private async loadMetricsForEventIds(
    ids: string[],
  ): Promise<Map<string, EventListMetrics>> {
    const map = new Map<string, EventListMetrics>();
    if (!ids.length) return map;

    for (const id of ids) {
      map.set(id, bootstrapMetrics());
    }

    const counts = await this.bookingsService.sumQuantityByEventIds(ids);
    for (const [eventId, qty] of counts) {
      const m = map.get(eventId);
      if (m) m.attendeeCount = qty;
    }

    const tierRows = await this.ticketsService.getTierMetricRows(ids);
    const byEvent = new Map<string, typeof tierRows>();
    for (const row of tierRows) {
      if (!byEvent.has(row.eventId)) {
        byEvent.set(row.eventId, []);
      }
      byEvent.get(row.eventId)!.push(row);
    }

    for (const [eid, list] of byEvent) {
      const m = map.get(eid);
      if (!m || !list.length) continue;

      const prices = list.map((r) => Number(r.price));
      m.minPrice = Math.min(...prices);
      const minRow = list.find((r) => Number(r.price) === m.minPrice)!;
      m.currency = minRow.currency;

      let capSum = 0;
      let hasUnlimited = false;
      for (const r of list) {
        if (r.quantityAvailable == null) {
          hasUnlimited = true;
          break;
        }
        capSum += Number(r.quantityAvailable);
      }
      m.capacity = hasUnlimited ? undefined : capSum;
    }

    return map;
  }

  async findFiltered(
    filter: EventsFilterQueryDto,
  ): Promise<PaginatedEventsResponseDto> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const at = this.now();

    const qb = this.eventRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.company', 'company')
      .leftJoinAndSelect('company.owner', 'owner')
      .where('e.status = :pub', { pub: EventStatus.PUBLISHED })
      .andWhere('(e.publishAt IS NULL OR e.publishAt <= :at)', { at });

    if (filter.format) {
      qb.andWhere('e.format = :format', { format: filter.format });
    }
    if (filter.category) {
      qb.andWhere('e.category = :category', { category: filter.category });
    }
    if (filter['tags[]']?.length) {
      qb.andWhere('e.tags && :tags::text[]', {
        tags: filter['tags[]'],
      });
    }
    if (filter.date_from) {
      qb.andWhere('e.date >= :df', { df: new Date(filter.date_from) });
    }
    if (filter.date_to) {
      qb.andWhere('e.date <= :dt', { dt: new Date(filter.date_to) });
    }
    if (filter.price_min !== undefined) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM tickets tpx WHERE tpx."eventId" = e.id AND tpx.price >= :pmin)`,
        { pmin: String(filter.price_min) },
      );
    }
    if (filter.price_max !== undefined) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM tickets tpy WHERE tpy."eventId" = e.id AND tpy.price <= :pmax)`,
        { pmax: String(filter.price_max) },
      );
    }
    if (filter.search?.trim()) {
      const term = `%${filter.search.trim().toLowerCase()}%`;
      qb.andWhere(
        new Brackets((q) => {
          q.where('LOWER(e.title) LIKE :term', { term })
            .orWhere('LOWER(e.description) LIKE :term', { term })
            .orWhere('LOWER(e.location) LIKE :term', { term });
        }),
      );
    }
    if (filter.location?.trim()) {
      qb.andWhere('LOWER(e.location) LIKE :loc', {
        loc: `%${filter.location.trim().toLowerCase()}%`,
      });
    }

    const sortOrder = filter.sort_order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    if (filter.sort_by === 'price') {
      qb.addSelect(
        '(SELECT COALESCE(MIN(t.price), 0) FROM tickets t WHERE t."eventId" = e.id)',
        'min_price',
      ).orderBy('min_price', sortOrder);
    } else {
      qb.orderBy('e.date', sortOrder);
    }

    const total = await qb.clone().getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const metrics = await this.loadMetricsForEventIds(rows.map((r) => r.id));

    const data = rows.map((e) =>
      this.toEventDto(e, metrics.get(e.id) ?? bootstrapMetrics()),
    );

    return { data, total, page, limit };
  }

  async findOneById(
    id: string,
    viewer?: User | null,
  ): Promise<EventResponseDto> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: [...EVENT_RELATIONS],
    });
    if (!event) throw new NotFoundException('Event not found');

    const viewerId = viewer?.id;
    const isOwner =
      viewerId != null && event.company.owner.id === viewerId;

    if (!this.isPubliclyVisible(event, this.now()) && !isOwner) {
      throw new NotFoundException('Event not found');
    }

    const metrics = await this.loadMetricsForEventIds([id]);
    const m = metrics.get(id) ?? bootstrapMetrics();

    let isSubscribed: boolean | undefined;
    if (viewerId != null) {
      isSubscribed = await this.bookingsService.userHasBookingForEvent(
        viewerId,
        id,
      );
    }

    return this.toEventDto(event, m, isSubscribed);
  }

  async create(
    userId: number,
    dto: CreateEventFieldsDto,
    files: { cover?: Express.Multer.File[]; photos?: Express.Multer.File[] },
    uploadImage: (f: Express.Multer.File, folder: string) => Promise<string>,
  ): Promise<EventResponseDto> {
    const company = await this.companiesService.findOwnedByUserId(userId);
    if (!company) {
      throw new ForbiddenException(
        'You must register a company before creating an event',
      );
    }

    let coverUrl: string | null = null;
    const photos: string[] = [];
    if (files.cover?.[0]) {
      coverUrl = await uploadImage(files.cover[0], 'events/covers');
    }
    if (files.photos?.length) {
      for (const f of files.photos) {
        photos.push(await uploadImage(f, 'events/photos'));
      }
    }

    const status = dto.status ?? EventStatus.PUBLISHED;
    const row = this.eventRepo.create({
      title: dto.title,
      description: dto.description,
      format: dto.format,
      category: dto.category,
      tags: dto.tags ?? [],
      date: new Date(dto.date),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      location: dto.location ?? null,
      lat:
        dto.lat !== undefined && dto.lat !== null ? String(dto.lat) : null,
      lng:
        dto.lng !== undefined && dto.lng !== null ? String(dto.lng) : null,
      coverUrl,
      photos: photos.length ? photos : [],
      company,
      status,
      publishAt: dto.publishAt ? new Date(dto.publishAt) : null,
      visitorListPrivacy:
        dto.visitorListPrivacy ?? VisitorListPrivacy.EVERYBODY,
      notifyOnNewVisitor: dto.notifyOnNewVisitor ?? false,
      redirectAfterPurchase: dto.redirectAfterPurchase ?? null,
    });

    const saved = await this.eventRepo.save(row);

    if (status === EventStatus.PUBLISHED) {
      const followerIds = await this.companyFollows.getFollowerIds(company.id);
      await Promise.all(
        followerIds.map((fid) =>
          this.notifications.notifyUser(
            fid,
            'company_new_event',
            `${company.name} published a new event: "${dto.title}"`,
          ),
        ),
      );
    }

    const defaultCurrency = dto.currency ?? 'USD';
    const ticketTiers =
      dto.tickets?.length
        ? dto.tickets
        : [
            {
              name: 'General admission',
              price: dto.price ?? 0,
              currency: defaultCurrency,
              capacity: dto.capacity ?? 1,
            },
          ];

    for (let i = 0; i < ticketTiers.length; i++) {
      const t = ticketTiers[i];
      await this.ticketsService.createTier(saved, {
        name: t.name,
        price: t.price,
        currency: t.currency ?? defaultCurrency,
        capacity: t.capacity,
        sortOrder: i,
        isDefault: i === 0,
      });
    }

    const full = await this.eventRepo.findOneOrFail({
      where: { id: saved.id },
      relations: [...EVENT_RELATIONS],
    });
    const metrics = await this.loadMetricsForEventIds([saved.id]);
    return this.toEventDto(full, metrics.get(saved.id) ?? bootstrapMetrics());
  }

  async update(
    eventId: string,
    userId: number,
    dto: UpdateEventFieldsDto,
    files: { cover?: Express.Multer.File[]; photos?: Express.Multer.File[] },
    uploadImage: (f: Express.Multer.File, folder: string) => Promise<string>,
  ): Promise<EventResponseDto> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: [...EVENT_RELATIONS],
    });
    if (!event) throw new NotFoundException('Event not found');
    this.assertUserOwnsEventCompany(userId, event);

    const prevStatus = event.status;
    const prevTitle = event.title;
    const prevDate = event.date?.toISOString();
    const prevLocation = event.location;

    if (dto.title !== undefined) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.format !== undefined) event.format = dto.format;
    if (dto.category !== undefined) event.category = dto.category;
    if (dto.tags !== undefined) event.tags = dto.tags;
    if (dto.date !== undefined) event.date = new Date(dto.date);
    if (dto.endDate !== undefined) {
      event.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }
    if (dto.location !== undefined) {
      event.location = dto.location ?? null;
    }
    if (dto.lat !== undefined) {
      event.lat =
        dto.lat !== undefined && dto.lat !== null ? String(dto.lat) : null;
    }
    if (dto.lng !== undefined) {
      event.lng =
        dto.lng !== undefined && dto.lng !== null ? String(dto.lng) : null;
    }
    if (dto.status !== undefined) event.status = dto.status;
    if (dto.publishAt !== undefined) {
      event.publishAt = dto.publishAt ? new Date(dto.publishAt) : null;
    }
    if (dto.visitorListPrivacy !== undefined) {
      event.visitorListPrivacy = dto.visitorListPrivacy;
    }
    if (dto.notifyOnNewVisitor !== undefined) {
      event.notifyOnNewVisitor = dto.notifyOnNewVisitor;
    }
    if (dto.redirectAfterPurchase !== undefined) {
      event.redirectAfterPurchase = dto.redirectAfterPurchase ?? null;
    }

    if (files.cover?.[0]) {
      event.coverUrl = await uploadImage(files.cover[0], 'events/covers');
    }
    if (files.photos?.length) {
      const anew: string[] = [];
      for (const f of files.photos) {
        anew.push(await uploadImage(f, 'events/photos'));
      }
      event.photos = anew;
    }

    await this.eventRepo.save(event);

    const subscriberIds = await this.eventSubscriptions.getSubscriberIds(eventId);
    if (subscriberIds.length) {
      const newStatus = event.status;
      if (newStatus === EventStatus.CANCELLED && prevStatus !== EventStatus.CANCELLED) {
        await Promise.all(
          subscriberIds.map((sid) =>
            this.notifications.notifyUser(
              sid,
              'event_cancelled',
              `The event "${event.title}" has been cancelled.`,
            ),
          ),
        );
      } else if (newStatus !== EventStatus.CANCELLED) {
        const dateChanged = dto.date !== undefined && event.date.toISOString() !== prevDate;
        const locationChanged = dto.location !== undefined && event.location !== prevLocation;
        const titleChanged = dto.title !== undefined && event.title !== prevTitle;
        if (dateChanged || locationChanged || titleChanged) {
          await Promise.all(
            subscriberIds.map((sid) =>
              this.notifications.notifyUser(
                sid,
                'event_update',
                `The event "${event.title}" has been updated.`,
              ),
            ),
          );
        }
      }
    }

    if (
      prevStatus !== EventStatus.PUBLISHED &&
      event.status === EventStatus.PUBLISHED
    ) {
      const followerIds = await this.companyFollows.getFollowerIds(event.company.id);
      await Promise.all(
        followerIds.map((fid) =>
          this.notifications.notifyUser(
            fid,
            'company_new_event',
            `${event.company.name} published a new event: "${event.title}"`,
          ),
        ),
      );
    }

    const defaultTier = await this.ticketsService.findDefaultByEventId(eventId);

    if (defaultTier) {
      if (dto.price !== undefined) {
        defaultTier.price = String(dto.price);
      }
      if (dto.currency !== undefined) {
        defaultTier.currency = dto.currency;
      }
      if (dto.capacity !== undefined) {
        const sold = await this.bookingsService.sumQuantityForTicket(
          defaultTier.id,
        );
        if (dto.capacity != null && sold > dto.capacity) {
          throw new BadRequestException(
            'Tier capacity cannot be less than seats already booked',
          );
        }
        defaultTier.quantityAvailable = dto.capacity ?? null;
      }
      await this.ticketsService.save(defaultTier);
    }

    const full = await this.eventRepo.findOneOrFail({
      where: { id: eventId },
      relations: [...EVENT_RELATIONS],
    });
    const metrics = await this.loadMetricsForEventIds([eventId]);
    return this.toEventDto(full, metrics.get(eventId) ?? bootstrapMetrics());
  }

  async updateTier(
    eventId: string,
    tierId: string,
    userId: number,
    dto: { name?: string; capacity?: number | null },
  ): Promise<TicketTierResponseDto> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: [...EVENT_RELATIONS],
    });
    if (!event) throw new NotFoundException('Event not found');
    this.assertUserOwnsEventCompany(userId, event);

    const tier = await this.ticketsService.findById(tierId);
    if (!tier || tier.event.id !== eventId) throw new NotFoundException('Tier not found');

    if (dto.capacity != null) {
      const sold = await this.bookingsService.sumQuantityForTicket(tierId);
      if (sold > dto.capacity) {
        throw new BadRequestException('Capacity cannot be less than seats already booked');
      }
    }

    const saved = await this.ticketsService.patchTier(tier, dto);
    const sold = await this.bookingsService.sumQuantityForTicket(tierId);
    const available =
      saved.quantityAvailable != null
        ? Math.max(0, saved.quantityAvailable - sold)
        : null;

    return {
      id: saved.id,
      name: saved.name,
      description: saved.description ?? undefined,
      price: Number(saved.price),
      currency: saved.currency,
      capacity: saved.quantityAvailable,
      availableSpots: available,
      isDefault: saved.isDefault,
      sortOrder: saved.sortOrder,
    };
  }

  async addTier(
    eventId: string,
    userId: number,
    dto: { name: string; price: number; currency?: string; capacity?: number | null },
  ): Promise<TicketTierResponseDto> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: [...EVENT_RELATIONS],
    });
    if (!event) throw new NotFoundException('Event not found');
    this.assertUserOwnsEventCompany(userId, event);

    const existing = await this.ticketsService.findAllForEvent(eventId);
    const maxOrder = existing.reduce((m, t) => Math.max(m, t.sortOrder), -1);

    const tier = await this.ticketsService.createTier(event, {
      name: dto.name,
      price: dto.price,
      currency: dto.currency ?? 'USD',
      capacity: dto.capacity ?? null,
      sortOrder: maxOrder + 1,
      isDefault: false,
    });

    return {
      id: tier.id,
      name: tier.name,
      description: tier.description ?? undefined,
      price: Number(tier.price),
      currency: tier.currency,
      capacity: tier.quantityAvailable,
      availableSpots: tier.quantityAvailable,
      isDefault: tier.isDefault,
      sortOrder: tier.sortOrder,
    };
  }

  async remove(eventId: string, userId: number): Promise<void> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: [...EVENT_RELATIONS],
    });
    if (!event) throw new NotFoundException('Event not found');
    this.assertUserOwnsEventCompany(userId, event);
    await this.eventRepo.remove(event);
  }

  async findSimilar(
    id: string,
    limit: number,
  ): Promise<EventResponseDto[]> {
    const event = await this.eventRepo.findOne({
      where: { id },
      relations: [...EVENT_RELATIONS],
    });
    if (!event) throw new NotFoundException('Event not found');

    const at = this.now();
    const qb = this.eventRepo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.company', 'company')
      .leftJoinAndSelect('company.owner', 'owner')
      .where('e.id != :id', { id })
      .andWhere('e.status = :pub', { pub: EventStatus.PUBLISHED })
      .andWhere('(e.publishAt IS NULL OR e.publishAt <= :at)', { at })
      .andWhere(
        new Brackets((q) => {
          q.where('e.category = :cat', { cat: event.category });
          if (event.tags?.length) {
            q.orWhere('e.tags && :tags::text[]', { tags: event.tags });
          }
        }),
      )
      .orderBy('e.date', 'ASC')
      .take(limit);

    const rows = await qb.getMany();
    const metrics = await this.loadMetricsForEventIds(rows.map((r) => r.id));
    return rows.map((e) =>
      this.toEventDto(e, metrics.get(e.id) ?? bootstrapMetrics()),
    );
  }

  async subscribe(
    userId: number,
    eventId: string,
    ticketId?: string,
    quantity = 1,
    hidden = false,
    promoCode?: string,
  ): Promise<void> {
    if (quantity < 1) {
      throw new BadRequestException('quantity must be at least 1');
    }

    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: [...EVENT_RELATIONS],
    });
    if (!event) throw new NotFoundException('Event not found');
    if (!this.isPubliclyVisible(event, this.now())) {
      throw new NotFoundException('Event not found');
    }

    const already = await this.bookingsService.userHasBookingForEvent(
      userId,
      eventId,
    );
    if (already) {
      throw new ConflictException('Already booked this event');
    }

    const tiers = await this.ticketsService.findOrderedForEvent(eventId);
    if (!tiers.length) {
      throw new BadRequestException('No ticket tiers available');
    }

    let tier: Ticket;
    let soldOnTier: number;
    if (ticketId) {
      const t = tiers.find((x) => x.id === ticketId);
      if (!t) throw new NotFoundException('Ticket tier not found');
      tier = t;
      soldOnTier = await this.bookingsService.sumQuantityForTicket(tier.id);
    } else if (tiers.length === 1) {
      tier = tiers[0];
      soldOnTier = await this.bookingsService.sumQuantityForTicket(tier.id);
    } else {
      // If the frontend doesn’t specify a tier, pick the best matching tier:
      // 1) Prefer the default tier if it has capacity.
      // 2) Otherwise, pick the cheapest tier that can fit the requested quantity.
      const defaultTier = tiers.find((t) => t.isDefault);

      if (defaultTier) {
        const sold = await this.bookingsService.sumQuantityForTicket(
          defaultTier.id,
        );
        const canFit =
          defaultTier.quantityAvailable == null ||
          sold + quantity <= defaultTier.quantityAvailable;

        if (canFit) {
          tier = defaultTier;
          soldOnTier = sold;
        } else {
          tier = await this.pickCheapestTierThatFits(
            tiers,
            quantity,
          );
          soldOnTier = await this.bookingsService.sumQuantityForTicket(tier.id);
        }
      } else {
        tier = await this.pickCheapestTierThatFits(tiers, quantity);
        soldOnTier = await this.bookingsService.sumQuantityForTicket(tier.id);
      }
    }

    if (
      tier.quantityAvailable != null &&
      soldOnTier + quantity > tier.quantityAvailable
    ) {
      throw new ConflictException('Not enough seats left for this ticket tier');
    }

    const allTiers = await this.ticketsService.findAllForEvent(eventId);
    const hasUnlimited = allTiers.some((t) => t.quantityAvailable == null);
    const totalCap = hasUnlimited
      ? null
      : allTiers.reduce((s, t) => s + Number(t.quantityAvailable ?? 0), 0);
    const totalSold = await this.bookingsService.totalBookedForEvent(eventId);
    if (totalCap != null && totalSold + quantity > totalCap) {
      throw new ConflictException('Event is full');
    }

    let finalAmount: number | undefined;
    let promoId: string | undefined;
    if (promoCode) {
      const promo = await this.promoCodes.validate(eventId, promoCode);
      const base = Number(tier.price) * quantity;
      finalAmount = promo.discountType === 'percentage'
        ? Math.max(0, base * (1 - Number(promo.discount) / 100))
        : Math.max(0, base - Number(promo.discount));
      promoId = promo.id;
    }

    const user = await this.usersService.findOne(userId).catch(() => null);
    await this.bookingsService.recordPurchase({
      userId,
      event,
      tier,
      quantity,
      hidden,
      finalAmount,
      userEmail: user?.email,
      userName: user?.name,
    });

    if (promoId) {
      await this.promoCodes.redeem(promoId);
    }
  }

  private async pickCheapestTierThatFits(
    tiers: Ticket[],
    quantity: number,
  ): Promise<Ticket> {
    const ordered = [...tiers].sort((a, b) => {
      const ap = Number(a.price);
      const bp = Number(b.price);
      if (ap !== bp) return ap - bp;
      return a.sortOrder - b.sortOrder;
    });

    for (const t of ordered) {
      const sold = await this.bookingsService.sumQuantityForTicket(t.id);
      const canFit = t.quantityAvailable == null || sold + quantity <= t.quantityAvailable;
      if (canFit) return t;
    }

    throw new ConflictException('Event is full');
  }

  async unsubscribe(userId: number, eventId: string): Promise<void> {
    const removed = await this.bookingsService.removeAllForUserAndEvent(
      userId,
      eventId,
    );
    if (!removed) {
      throw new NotFoundException('No booking found for this event');
    }
  }

  async getAttendees(
    eventId: string,
    requester?: User | null,
  ): Promise<EventAttendeeResponseDto[]> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: [...EVENT_RELATIONS],
    });
    if (!event) throw new NotFoundException('Event not found');
    if (!this.isPubliclyVisible(event, this.now())) {
      throw new NotFoundException('Event not found');
    }

    if (event.visitorListPrivacy === VisitorListPrivacy.ATTENDEES) {
      const rid = requester?.id;
      if (rid == null) {
        throw new ForbiddenException('Sign in to view attendees');
      }
      const allowed = await this.bookingsService.userHasBookingForEvent(
        rid,
        eventId,
      );
      if (!allowed) {
        throw new ForbiddenException('Only attendees can view this list');
      }
    }

    const bookings = await this.bookingsService.findForAttendeeList(eventId);

    const seen = new Set<number>();
    const out: EventAttendeeResponseDto[] = [];
    for (const b of bookings) {
      const uid = b.user.id;
      if (seen.has(uid)) continue;
      seen.add(uid);
      const u = b.user;
      const visible = u.profilePublic;
      out.push({
        id: String(u.id),
        name: visible ? (u.name?.trim() || 'Member') : 'Private attendee',
        avatarUrl: visible ? (u.avatarUrl ?? undefined) : undefined,
        profileVisible: visible,
      });
    }
    return out;
  }

  async getTicketsForEvent(eventId: string): Promise<TicketTierResponseDto[]> {
    const event = await this.eventRepo.findOne({
      where: { id: eventId },
      relations: [...EVENT_RELATIONS],
    });
    if (!event) throw new NotFoundException('Event not found');
    if (!this.isPubliclyVisible(event, this.now()))
      throw new NotFoundException('Event not found');

    const tiers = await this.ticketsService.findOrderedForEvent(eventId);
    return Promise.all(
      tiers.map(async (t) => {
        const sold = await this.bookingsService.sumQuantityForTicket(t.id);
        const available =
          t.quantityAvailable != null
            ? Math.max(0, t.quantityAvailable - sold)
            : null;
        return {
          id: t.id,
          name: t.name,
          description: t.description ?? undefined,
          price: Number(t.price),
          currency: t.currency,
          capacity: t.quantityAvailable,
          availableSpots: available,
          isDefault: t.isDefault,
          sortOrder: t.sortOrder,
        };
      }),
    );
  }
}

function bootstrapMetrics(): EventListMetrics {
  return {
    attendeeCount: 0,
    minPrice: 0,
    currency: 'USD',
    capacity: undefined,
  };
}
