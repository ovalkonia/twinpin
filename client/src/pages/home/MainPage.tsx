import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import { useAuth } from '../../context/AuthContext';
import { IconCalendar, IconMapPin } from '../../assets/icons';
import { getEvents, type Event } from '../../services/events';
import './dashboard.css';

export const MainPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState<Event[]>([]);

    useEffect(() => {
        setLoading(true);
        getEvents({ limit: 8, dateFrom: new Date().toISOString() })
            .then((res) => setEvents(res.data))
            .catch(() => setEvents([]))
            .finally(() => setLoading(false));
    }, []);

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
                    <h2 className="dashboard-section-title">Upcoming Events</h2>
                    <button className="dashboard-see-all">See all</button>
                </div>

                <div className="events-grid">
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
                                    style={{ background: gradientFor(event.category) }}
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

