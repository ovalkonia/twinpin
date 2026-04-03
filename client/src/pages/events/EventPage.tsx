import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import { useAuth } from '../../context/AuthContext';
import EventCover from '../../components/Events/EventCover.tsx';
import EventPhotoSpiral from '../../components/Events/EventPhotoSpiral.tsx';
import EventHeaderBlock from '../../components/Events/EventHeaderBlock.tsx';
import EventMap from '../../components/Events/EventMap.tsx';
import EventFaq from '../../components/Events/EventFaq.tsx';
import EventGoing from '../../components/Events/EventGoing.tsx';
import EventInfoCard from '../../components/Events/EventInfoCard.tsx';
import EventTicketSelector from '../../components/Events/EventTicketSelector.tsx';
import EventShare from '../../components/Events/EventShare.tsx';
import EventLightbox from '../../components/Events/EventLightbox.tsx';
import EventSimilar from '../../components/Events/EventSimilar.tsx';
import {
    getEventById,
    getEventAttendees,
    getEventTickets,
    unsubscribeFromEvent,
    type Event,
    type EventAttendee,
    type TicketTier,
} from '../../services/events';
import '../../styles/event-page.css';

// ─── Local shape ──────────────────────────────────────────────────────────────

interface EventData {
    id: string;
    name: string;
    description: string;
    coverPhoto: string | null;
    photos: string[];
    date: string;
    time: string;
    location: { name: string; address: string; lat?: number; lng?: number };
    organizer: string;
    price: number | 'free';
    category: string;
    tags: string[];
    status: 'upcoming' | 'ongoing' | 'past';
    capacity: number;
    spotsLeft: number;
    faq: { question: string; answer: string }[];
    attendees: { id: string; name: string; avatarUrl?: string }[];
    tickets: TicketTier[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
}

function formatTimeRange(start: string, end?: string): string {
    const fmt = (iso: string) =>
        new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

function deriveStatus(start: string, end?: string): EventData['status'] {
    const now = Date.now();
    const s = new Date(start).getTime();
    const e = end ? new Date(end).getTime() : s + 3_600_000;
    if (now < s) return 'upcoming';
    if (now < e) return 'ongoing';
    return 'past';
}

function mapEvent(event: Event, attendees: EventAttendee[]): Omit<EventData, 'tickets'> {
    return {
        id: event.id,
        name: event.title,
        description: event.description,
        coverPhoto: event.coverUrl ?? null,
        photos: event.photos ?? [],
        date: formatDate(event.date),
        time: formatTimeRange(event.date, event.endDate),
        location: {
            name: event.location ?? '',
            address: event.location ?? '',
            lat: event.lat,
            lng: event.lng,
        },
        organizer: event.organizerName,
        price: event.price === 0 ? 'free' : event.price,
        category: event.category,
        tags: event.tags ?? [],
        status: deriveStatus(event.date, event.endDate),
        capacity: event.capacity ?? 0,
        spotsLeft: event.capacity ? event.capacity - event.attendeeCount : 0,
        faq: [],
        attendees: attendees
            .filter(a => a.profileVisible)
            .map(a => ({ id: a.id, name: a.name, avatarUrl: a.avatarUrl })),
    };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventPage() {
    const { id, eventId } = useParams<{ id?: string; eventId?: string }>();
    const navigate = useNavigate();
    const { isAuth } = useAuth();

    const [event, setEvent]               = useState<EventData | null>(null);
    const [loading, setLoading]           = useState(true);
    const [isBooked, setIsBooked]         = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);

    useEffect(() => {
        const resolvedId = id ?? eventId;
        if (!resolvedId) return;
        setLoading(true);

        Promise.all([
            getEventById(resolvedId),
            getEventAttendees(resolvedId),
            getEventTickets(resolvedId),
        ])
            .then(([evt, attendees, tickets]) => {
                setEvent({ ...mapEvent(evt, attendees), tickets });
                setIsBooked(evt.isSubscribed ?? false);
            })
            .catch(() => toast.error('Failed to load event'))
            .finally(() => setLoading(false));
    }, [id, eventId]);

    const handleCancel = async () => {
        if (!event) return;
        setCancelLoading(true);
        try {
            await unsubscribeFromEvent(event.id);
            setIsBooked(false);
            toast.success('Booking cancelled');
        } catch {
            toast.error('Failed to cancel booking');
        } finally {
            setCancelLoading(false);
        }
    };

    const handleCheckout = (ticketId: string, qty: number) => {
        if (!event) return;
        navigate(`/checkout/${event.id}?ticketId=${ticketId}&qty=${qty}`);
    };

    if (loading) {
        return (
            <div className="event-page">
                <Header />
                <div className="event-map-skeleton" style={{ height: '320px', margin: '64px 0 0' }} />
            </div>
        );
    }

    if (!event) return null;

    return (
        <div className="event-page">
            <Header />

            <EventCover coverPhoto={event.coverPhoto} name={event.name} />

            <EventPhotoSpiral photos={event.photos} onPhotoClick={setLightboxMedia} />

            <div className="event-layout">
                <main className="event-main">
                    <EventHeaderBlock
                        name={event.name}
                        category={event.category}
                        tags={event.tags}
                        status={event.status}
                        date={event.date}
                        time={event.time}
                    />

                    {event.description && (
                        <div className="event-description">
                            <h3 className="event-section-title">About</h3>
                            <p className="event-description-text">{event.description}</p>
                        </div>
                    )}

                    <EventMap location={event.location} />
                    <EventFaq faq={event.faq} />
                    <EventGoing attendees={event.attendees} />
                    <EventSimilar eventId={event.id} />
                </main>

                <aside className="event-sidebar">
                    <EventInfoCard
                        date={event.date}
                        time={event.time}
                        location={event.location}
                        organizer={event.organizer}
                        price={event.price}
                        capacity={event.capacity}
                        spotsLeft={event.spotsLeft}
                    />
                    <EventTicketSelector
                        tickets={event.tickets}
                        isBooked={isBooked}
                        isAuth={isAuth}
                        loading={cancelLoading}
                        onCheckout={handleCheckout}
                        onCancel={handleCancel}
                        onAuthRequired={() => navigate('/auth/sign-in')}
                    />
                    <EventShare eventName={event.name} />
                </aside>
            </div>

            {lightboxMedia && (
                <EventLightbox photo={lightboxMedia} onClose={() => setLightboxMedia(null)} />
            )}
        </div>
    );
}
