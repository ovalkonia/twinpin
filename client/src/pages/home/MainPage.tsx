import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import { useAuth } from '../../context/AuthContext';
import { IconCalendar, IconMapPin } from '../../assets/icons';
import { getEvents, type Event } from '../../services/events';
import toast from 'react-hot-toast';
import './dashboard.css';

export const MainPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<Event[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        setLoading(true);
        getEvents({ limit: 20, page })
            .then((res) => {
                setEvents(res.data);
                setTotal(res.total);
            })
            .catch((err) => {
                const msg = err?.response?.data?.message;
                toast.error(typeof msg === 'string' ? msg : 'Failed to load events');
                setEvents([]);
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadMore = async () => {
        if (loadingMore) return;
        const nextPage = page + 1;
        setLoadingMore(true);
        try {
            const res = await getEvents({ limit: 20, page: nextPage });
            setEvents(prev => [...prev, ...res.data]);
            setPage(nextPage);
            setTotal(res.total);
        } catch {
            toast.error('Failed to load more events');
        } finally {
            setLoadingMore(false);
        }
    };

    const gradientFor = useMemo(() => {
        const map: Record<string, string> = {
            Music: 'linear-gradient(135deg, #1a0a2e, #16213e)',
            Theatre: 'linear-gradient(135deg, #2e0a1a, #1a0a2e)',
            Tech: 'linear-gradient(135deg, #0a2e2e, #0a1a2e)',
            Sport: 'linear-gradient(135deg, #0a2e0a, #2e0a1a)',
            Art: 'linear-gradient(135deg, #2e1a0a, #2e0a0a)',
            Food: 'linear-gradient(135deg, #2e2a0a, #2e1a0a)',
            Business: 'linear-gradient(135deg, #0a2e2e, #0f0f0f)',
        };
        return (category: string) =>
            map[category] ?? 'linear-gradient(135deg, #1a1a2e, #0a0a1a)';
    }, []);

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

    const priceLabel = (price: number) => (price === 0 ? 'Free' : `$${price}`);

    return (
        <div className="dashboard">
            <Header />

            <div className="dashboard-welcome">
                <h1 className="dashboard-greeting">
                    Welcome back, {user?.name || 'there'}!
                </h1>
                <p className="dashboard-subtitle">
                    Discover and book events happening near you
                </p>
            </div>

            <div className="dashboard-section">
                <div className="dashboard-section-header">
                    <h2 className="dashboard-section-title">All Events</h2>
                    <button
                        className="dashboard-see-all"
                        onClick={loadMore}
                        disabled={events.length >= total || loadingMore}
                    >
                        {events.length >= total ? 'All loaded' : loadingMore ? 'Loading…' : 'Load more'}
                    </button>
                </div>

                <div className="events-grid">
                    {!loading && events.length === 0 && (
                        <p style={{ color: '#666', gridColumn: '1/-1', textAlign: 'center', padding: '48px 0' }}>
                            No published events yet. Check back soon!
                        </p>
                    )}
                    {loading
                        ? null
                        : events.map((event) => (
                            <div
                                key={event.id}
                                className="event-card"
                                onClick={() => navigate(`/events/${event.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div
                                    className="event-card-image"
                                    style={
                                        event.coverUrl
                                            ? {
                                                backgroundImage: `url(${event.coverUrl})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }
                                            : { background: gradientFor(event.category) }
                                    }
                                >
                                    <span className="event-card-category">
                                        {event.category}
                                    </span>
                                </div>
                                <div className="event-card-body">
                                    <div className="event-card-title">
                                        {event.title}
                                    </div>
                                    <div className="event-card-meta">
                                        <span className="event-card-meta-row">
                                            <IconCalendar size={12} />
                                            {formatDate(event.date)}
                                        </span>
                                        <span className="event-card-meta-row">
                                            <IconMapPin size={12} />
                                            {event.location ?? ''}
                                        </span>
                                    </div>
                                    <div className="event-card-footer">
                                        <span className="event-card-price">
                                            {priceLabel(event.price)}
                                        </span>
                                        <button
                                            className="event-card-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/events/${event.id}`);
                                            }}
                                        >
                                            Get Ticket
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

