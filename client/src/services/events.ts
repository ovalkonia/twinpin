import api from './api';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Event {
    id: string;
    title: string;
    description: string;
    format: 'online' | 'offline';
    category: string;
    tags: string[];
    date: string;           // ISO 8601
    endDate?: string;
    location?: string;
    lat?: number;
    lng?: number;
    price: number;
    currency: string;
    capacity?: number;
    attendeeCount: number;
    coverUrl?: string;
    photos?: string[];
    organizerId: string;
    organizerName: string;
    status: 'draft' | 'published' | 'cancelled';
    isSubscribed?: boolean;
}

export interface TicketTier {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    availableSpots: number | null;
    isDefault: boolean;
    sortOrder: number;
}

export interface EventAttendee {
    id: string;
    name: string;
    avatarUrl?: string;
    profileVisible: boolean;
}

export interface EventComment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl?: string;
    body: string;
    createdAt: string;
}

export interface EventsFilter {
    format?: 'online' | 'offline';
    category?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    priceMin?: number;
    priceMax?: number;
    search?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedEvents {
    data: Event[];
    total: number;
    page: number;
    limit: number;
}

export interface CreateEventInput {
    title: string;
    description: string;
    format: 'online' | 'offline';
    category: string;
    tags?: string[];
    date: string;
    endDate?: string;
    location?: string;
    lat?: number;
    lng?: number;
    price?: number;
    currency?: string;
    capacity?: number;
    cover?: File;
    photos?: File[];
    /** When the event becomes publicly visible (scheduled events). */
    publishAt?: string;
    status?: 'draft' | 'published';

    /** Controls whether attendees can see the attendee list. */
    visitorListPrivacy?: 'everybody' | 'attendees';

    /** Whether the organizer receives a notification when a new visitor books. */
    notifyOnNewVisitor?: boolean;

    /** Optional redirect after successful purchase. */
    redirectAfterPurchase?: string;

    tickets?: Array<{
        name: string;
        price: number;
        currency?: string;
        capacity: number;
    }>;
}

export type UpdateEventInput = Partial<CreateEventInput>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildEventFormData(input: CreateEventInput | UpdateEventInput): FormData {
    const fd = new FormData();

    (Object.keys(input) as (keyof typeof input)[]).forEach(key => {
        const value = input[key];
        if (value === undefined || value === null) return;

        if (key === 'tags' && Array.isArray(value)) {
            value.forEach(tag => fd.append('tags[]', tag));
        } else if (key === 'tickets' && Array.isArray(value)) {
            fd.append('tickets', JSON.stringify(value));
        } else if (key === 'photos' && Array.isArray(value)) {
            value.forEach(file => fd.append('photos', file));
        } else if (value instanceof File) {
            fd.append(key, value);
        } else {
            fd.append(key, String(value));
        }
    });

    return fd;
}

function toQueryString(filter: EventsFilter): string {
    const params = new URLSearchParams();

    if (filter.format)   params.set('format', filter.format);
    if (filter.category) params.set('category', filter.category);
    if (filter.dateFrom) params.set('date_from', filter.dateFrom);
    if (filter.dateTo)   params.set('date_to', filter.dateTo);
    if (filter.priceMin !== undefined) params.set('price_min', String(filter.priceMin));
    if (filter.priceMax !== undefined) params.set('price_max', String(filter.priceMax));
    if (filter.search)   params.set('search', filter.search);
    if (filter.page)     params.set('page', String(filter.page));
    if (filter.limit)    params.set('limit', String(filter.limit));
    if (filter.tags?.length) filter.tags.forEach(t => params.append('tags[]', t));

    const qs = params.toString();
    return qs ? `?${qs}` : '';
}

// ─── Event CRUD ───────────────────────────────────────────────────────────────

/** Fetch a paginated + filtered list of events. */
export const getEvents = async (filter: EventsFilter = {}): Promise<PaginatedEvents> => {
    const response = await api.get<PaginatedEvents>(`/events${toQueryString(filter)}`);
    return response.data;
};

/** Fetch a single event by ID. */
export const getEventById = async (id: string): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
};

/** Create a new event (multipart — supports cover + photos). */
export const createEvent = async (input: CreateEventInput): Promise<Event> => {
    const response = await api.post<Event>('/events', buildEventFormData(input), {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/** Update an event. Only the provided fields are sent. */
export const updateEvent = async (id: string, input: UpdateEventInput): Promise<Event> => {
    const response = await api.patch<Event>(`/events/${id}`, buildEventFormData(input), {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

/** Fetch ticket tiers for an event with live availability. */
export const getEventTickets = async (id: string): Promise<TicketTier[]> => {
    const response = await api.get<TicketTier[]>(`/events/${id}/tickets`);
    return response.data;
};

/** Delete an event. */
export const deleteEvent = async (id: string): Promise<void> => {
    await api.delete(`/events/${id}`);
};

// ─── Discovery ────────────────────────────────────────────────────────────────

/** Fetch events similar to the given one (matched by tags / category). */
export const getSimilarEvents = async (id: string, limit = 4): Promise<Event[]> => {
    const response = await api.get<Event[]>(`/events/${id}/similar?limit=${limit}`);
    return response.data;
};

// ─── Attendance ───────────────────────────────────────────────────────────────

/** Subscribe the current user to an event (book a spot). */
export const subscribeToEvent = async (
    id: string,
    quantity = 1,
    ticketId?: string,
): Promise<void> => {
    const params = new URLSearchParams();
    params.set('quantity', String(quantity));
    if (ticketId) params.set('ticketId', ticketId);
    await api.post(`/events/${id}/subscribe?${params.toString()}`);
};

/** Unsubscribe the current user from an event. */
export const unsubscribeFromEvent = async (id: string): Promise<void> => {
    await api.delete(`/events/${id}/subscribe`);
};

/**
 * Fetch the attendee list for an event.
 * Users with private profiles are included but their name/avatar are hidden
 * (profileVisible: false) — that filtering is enforced server-side.
 */
export const getEventAttendees = async (id: string): Promise<EventAttendee[]> => {
    const response = await api.get<EventAttendee[]>(`/events/${id}/attendees`);
    return response.data;
};

// ─── Comments ─────────────────────────────────────────────────────────────────

/** Fetch all comments (reviews / questions) for an event. */
export const getEventComments = async (id: string): Promise<EventComment[]> => {
    const response = await api.get<EventComment[]>(`/events/${id}/comments`);
    return response.data;
};

/** Post a review or question on an event. */
export const addEventComment = async (id: string, body: string): Promise<EventComment> => {
    const response = await api.post<EventComment>(`/events/${id}/comments`, { body });
    return response.data;
};

/** Delete a comment (author or organizer only). */
export const deleteEventComment = async (eventId: string, commentId: string): Promise<void> => {
    await api.delete(`/events/${eventId}/comments/${commentId}`);
};

// ─── Organizer follow ─────────────────────────────────────────────────────────

/** Follow an organizer to receive their event updates. */
export const followOrganizer = async (organizerId: string): Promise<void> => {
    await api.post(`/organizers/${organizerId}/follow`);
};

/** Unfollow an organizer. */
export const unfollowOrganizer = async (organizerId: string): Promise<void> => {
    await api.delete(`/organizers/${organizerId}/follow`);
};