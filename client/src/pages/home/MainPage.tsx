import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import { useAuth } from '../../context/AuthContext';
import { IconCalendar, IconMapPin } from '../../assets/icons';
import './dashboard.css';

const PLACEHOLDER_EVENTS = [
    { id: 1, category: 'Music',   gradient: 'linear-gradient(135deg, #1a0a2e, #16213e)', title: 'Rock Night Live',       date: 'Apr 12, 2026', location: 'New York, NY',    price: '$25'  },
    { id: 2, category: 'Theatre', gradient: 'linear-gradient(135deg, #2e0a1a, #1a0a2e)', title: 'Shakespeare Festival',  date: 'Apr 18, 2026', location: 'London, UK',      price: '$40'  },
    { id: 3, category: 'Tech',    gradient: 'linear-gradient(135deg, #0a2e2e, #0a1a2e)', title: 'Dev Conference 2026',   date: 'May 3, 2026',  location: 'San Francisco',   price: '$120' },
    { id: 4, category: 'Sport',   gradient: 'linear-gradient(135deg, #0a2e0a, #0a2e1a)', title: 'City Marathon 5K',      date: 'May 10, 2026', location: 'Chicago, IL',     price: 'Free' },
    { id: 5, category: 'Art',     gradient: 'linear-gradient(135deg, #2e1a0a, #2e0a0a)', title: 'Modern Art Exhibition', date: 'May 15, 2026', location: 'Paris, France',   price: '$15'  },
    { id: 6, category: 'Food',    gradient: 'linear-gradient(135deg, #2e2a0a, #2e1a0a)', title: 'Street Food Festival',  date: 'May 22, 2026', location: 'Austin, TX',      price: 'Free' },
    { id: 7, category: 'Cinema',  gradient: 'linear-gradient(135deg, #1a1a1a, #0f0f0f)', title: 'Indie Film Screening',  date: 'Jun 1, 2026',  location: 'Los Angeles, CA', price: '$18'  },
    { id: 8, category: 'Gaming',  gradient: 'linear-gradient(135deg, #0a0a2e, #1a0a2e)', title: 'GameCon Expo 2026',     date: 'Jun 8, 2026',  location: 'Seattle, WA',     price: '$55'  },
];

export const MainPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="dashboard">
            <Header />

            <div className="dashboard-welcome">
                <h1 className="dashboard-greeting">Welcome back, {user?.name || 'there'}!</h1>
                <p className="dashboard-subtitle">Discover and book events happening near you</p>
            </div>

            <div className="dashboard-section">
                <div className="dashboard-section-header">
                    <h2 className="dashboard-section-title">Upcoming Events</h2>
                    <button className="dashboard-see-all">See all</button>
                </div>

                <div className="events-grid">
                    {PLACEHOLDER_EVENTS.map(event => (
                        <div key={event.id} className="event-card" onClick={() => navigate(`/events/${event.id}`)} style={{ cursor: 'pointer' }}>
                            <div className="event-card-image" style={{ background: event.gradient }}>
                                <span className="event-card-category">{event.category}</span>
                            </div>
                            <div className="event-card-body">
                                <div className="event-card-title">{event.title}</div>
                                <div className="event-card-meta">
                                    <span className="event-card-meta-row">
                                        <IconCalendar size={12} />
                                        {event.date}
                                    </span>
                                    <span className="event-card-meta-row">
                                        <IconMapPin size={12} />
                                        {event.location}
                                    </span>
                                </div>
                                <div className="event-card-footer">
                                    <span className="event-card-price">{event.price}</span>
                                    <button className="event-card-btn" onClick={e => { e.stopPropagation(); navigate(`/events/${event.id}`); }}>Get Ticket</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};