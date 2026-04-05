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
import EventComments from '../../components/Events/EventComments.tsx';
import { Link } from 'react-router-dom';
import {
    getEventById,
    getEventAttendees,
    getEventTickets,
    unsubscribeFromEvent,
    watchEvent,
    unwatchEvent,
    getEventWatchStatus,
    type Event,
    type EventAttendee,
    type TicketTier,
} from '../../services/events';
import {
    followCompany,
    unfollowCompany,
    getCompanyFollowStatus,
} from '../../services/company';
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
    organizerSlug?: string;
    organizerLogoUrl?: string;
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
        organizerSlug: event.organizerSlug,
        organizerLogoUrl: event.organizerLogoUrl,
        price: event.price === 0 ? 'free' : event.price,
        category: event.category,
        tags: (event.tags ?? []).filter(t => t !== event.category),
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
    const { isAuth, user } = useAuth();

    const [event, setEvent]               = useState<EventData | null>(null);
    const [rawEvent, setRawEvent]         = useState<Event | null>(null);
    const [loading, setLoading]           = useState(true);
    const [isBooked, setIsBooked]         = useState(false);
    const [isTicketUsed, setIsTicketUsed] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [lightboxMedia, setLightboxMedia] = useState<string | null>(null);
    const [isWatching, setIsWatching]     = useState(false);
    const [watchLoading, setWatchLoading] = useState(false);
    const [isFollowing, setIsFollowing]   = useState(false);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        const resolvedId = id ?? eventId;
        if (!resolvedId) return;
        setLoading(true);

        const watchStatusP = user ? getEventWatchStatus(resolvedId).catch(() => false) : Promise.resolve(false);

        Promise.all([
            getEventById(resolvedId),
            getEventAttendees(resolvedId).catch(() => [] as EventAttendee[]),
            getEventTickets(resolvedId),
            watchStatusP,
        ])
            .then(([evt, attendees, tickets, watching]) => {
                setEvent({ ...mapEvent(evt, attendees), tickets });
                setRawEvent(evt);
                setIsBooked(evt.isSubscribed ?? false);
                setIsTicketUsed(evt.isTicketUsed ?? false);
                setIsWatching(watching);
                if (user && evt.organizerCompanyId) {
                    getCompanyFollowStatus(evt.organizerCompanyId)
                        .then(setIsFollowing)
                        .catch(() => {});
                }
            })
            .catch(() => toast.error('Failed to load event'))
            .finally(() => setLoading(false));
    }, [id, eventId, user]);

    const handleCancel = async () => {
        if (!event) return;
        setCancelLoading(true);
        try {
            await unsubscribeFromEvent(event.id);
            setIsBooked(false);
            const freshTickets = await getEventTickets(event.id);
            setEvent(prev => prev ? { ...prev, tickets: freshTickets } : prev);
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

    const handleWatch = async () => {
        if (!event) return;
        if (!isAuth) { navigate('/auth/sign-in'); return; }
        setWatchLoading(true);
        try {
            if (isWatching) {
                await unwatchEvent(event.id);
                setIsWatching(false);
                toast.success('Unsubscribed from notifications');
            } else {
                await watchEvent(event.id);
                setIsWatching(true);
                toast.success('Subscribed to event notifications');
            }
        } catch {
            toast.error('Failed to update subscription');
        } finally {
            setWatchLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!rawEvent?.organizerCompanyId) return;
        if (!isAuth) { navigate('/auth/sign-in'); return; }
        setFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowCompany(rawEvent.organizerCompanyId);
                setIsFollowing(false);
                toast.success('Unfollowed organizer');
            } else {
                await followCompany(rawEvent.organizerCompanyId);
                setIsFollowing(true);
                toast.success('Following organizer');
            }
        } catch {
            toast.error('Failed to update follow');
        } finally {
            setFollowLoading(false);
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
                    {/*<EventFaq faq={event.faq} />*/}
                    <EventGoing attendees={event.attendees} />
                    <EventSimilar eventId={event.id} />
                    <EventComments eventId={event.id} />
                </main>

                <aside className="event-sidebar">
                    {/* Organizer card */}
                    {event.organizerSlug ? (
                        <Link to={`/company/${event.organizerSlug}`} className="event-organizer-card">
                            <div className="event-organizer-logo">
                                {event.organizerLogoUrl
                                    ? <img src={event.organizerLogoUrl} alt={event.organizer} />
                                    : <span>{event.organizer[0]?.toUpperCase()}</span>}
                            </div>
                            <div className="event-organizer-info">
                                <p className="event-organizer-label">Organised by</p>
                                <p className="event-organizer-name">{event.organizer}</p>
                            </div>
                            <span className="event-organizer-arrow">›</span>
                        </Link>
                    ) : (
                        <div className="event-organizer-card event-organizer-card--static">
                            <div className="event-organizer-logo">
                                <span>{event.organizer[0]?.toUpperCase()}</span>
                            </div>
                            <div className="event-organizer-info">
                                <p className="event-organizer-label">Organised by</p>
                                <p className="event-organizer-name">{event.organizer}</p>
                            </div>
                        </div>
                    )}

                    {/* Follow organizer */}
                    <button
                        className={`event-follow-btn${isFollowing ? ' event-follow-btn--active' : ''}`}
                        onClick={handleFollow}
                        disabled={followLoading}
                    >
                        {isFollowing ? 'Following' : 'Follow organizer'}
                    </button>

                    {/* Watch event */}
                    <button
                        className={`event-watch-btn${isWatching ? ' event-watch-btn--active' : ''}`}
                        onClick={handleWatch}
                        disabled={watchLoading}
                    >
                        {isWatching ? 'Unfollow' : 'Follow event'}
                    </button>

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
                        isTicketUsed={isTicketUsed}
                        isPast={event.status === 'past'}
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
