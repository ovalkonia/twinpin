import Header from '../../components/Header/header';
import { useAuth } from '../../context/AuthContext';
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
                        <div key={event.id} className="event-card">
                            <div className="event-card-image" style={{ background: event.gradient }}>
                                <span className="event-card-category">{event.category}</span>
                            </div>
                            <div className="event-card-body">
                                <div className="event-card-title">{event.title}</div>
                                <div className="event-card-meta">
                                    <span className="event-card-meta-row">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        {event.date}
                                    </span>
                                    <span className="event-card-meta-row">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {event.location}
                                    </span>
                                </div>
                                <div className="event-card-footer">
                                    <span className="event-card-price">{event.price}</span>
                                    <button className="event-card-btn">Get Ticket</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};