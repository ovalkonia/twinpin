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
import EventBookButton from '../../components/Events/EventBookButton.tsx';
import EventShare from '../../components/Events/EventShare.tsx';
import EventLightbox from '../../components/Events/EventLightbox.tsx';
import {
    getEventById,
    getEventAttendees,
    subscribeToEvent,
    unsubscribeFromEvent,
    type Event,
    type EventAttendee,
} from '../../services/events';
import '../../styles/event-page.css';

// ─── Local shape used by sub-components ──────────────────────────────────────

interface EventData {
    id: string;
    name: string;
    coverPhoto: string | null;
    photos: string[];
    date: string;
    time: string;
    location: { name: string; address: string; lat?: number; lng?: number };
    organizer: string;
    price: number | 'free';
    category: string;
    status: 'upcoming' | 'ongoing' | 'past';
    capacity: number;
    spotsLeft: number;
    faq: { question: string; answer: string }[];
    attendees: { id: string; name: string }[];
}

// ─── Mapping helper ───────────────────────────────────────────────────────────

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

function mapEvent(event: Event, attendees: EventAttendee[]): EventData {
    return {
        id: event.id,
        name: event.title,
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
        status: deriveStatus(event.date, event.endDate),
        capacity: event.capacity ?? 0,
        spotsLeft: event.capacity ? event.capacity - event.attendeeCount : 0,
        faq: [],
        attendees: attendees
            .filter(a => a.profileVisible)
            .map(a => ({ id: a.id, name: a.name })),
    };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuth } = useAuth();

    const [event, setEvent]             = useState<EventData | null>(null);
    const [loading, setLoading]         = useState(true);
    const [isBooked, setIsBooked]       = useState(false);
    const [bookLoading, setBookLoading] = useState(false);
    const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);

        Promise.all([getEventById(id), getEventAttendees(id)])
            .then(([evt, attendees]) => {
                setEvent(mapEvent(evt, attendees));
                setIsBooked(evt.isSubscribed ?? false);
            })
            .catch(() => toast.error('Failed to load event'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleBook = async () => {
        if (!isAuth) { navigate('/auth/sign-in'); return; }
        if (!event) return;

        if (isBooked) {
            setBookLoading(true);
            try {
                await unsubscribeFromEvent(event.id);
                setIsBooked(false);
                toast.success('Booking cancelled');
            } catch {
                toast.error('Failed to cancel booking');
            } finally {
                setBookLoading(false);
            }
            return;
        }

        if (event.price === 'free') {
            setBookLoading(true);
            try {
                await subscribeToEvent(event.id);
                setIsBooked(true);
                toast.success('You\'re going!');
            } catch {
                toast.error('Failed to book event');
            } finally {
                setBookLoading(false);
            }
        } else {
            navigate(`/checkout/${event.id}`);
        }
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

            <EventPhotoSpiral photos={event.photos} onPhotoClick={setLightboxPhoto} />

            <div className="event-layout">
                <main className="event-main">
                    <EventHeaderBlock
                        name={event.name}
                        category={event.category}
                        status={event.status}
                        date={event.date}
                        time={event.time}
                    />
                    <EventMap location={event.location} />
                    <EventFaq faq={event.faq} />
                    <EventGoing attendees={event.attendees} />
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
                    <EventBookButton
                        isBooked={isBooked}
                        price={event.price}
                        onClick={bookLoading ? () => {} : handleBook}
                    />
                    <EventShare eventName={event.name} />
                </aside>
            </div>

            {lightboxPhoto && (
                <EventLightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
            )}
        </div>
    );
}