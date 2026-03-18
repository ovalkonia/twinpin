import { useState } from 'react';
import Header from '../../components/Header/header';
import { useAuth } from '../../context/AuthContext';
import '../../styles/profile.css';

const MY_CREATED_EVENTS = [
    { id: 1, category: 'Tech',   gradient: 'linear-gradient(135deg, #0a2e2e, #0a1a2e)', title: 'Dev Conference 2026',    date: 'May 3, 2026',  location: 'San Francisco', price: '$120' },
    { id: 2, category: 'Music',  gradient: 'linear-gradient(135deg, #1a0a2e, #16213e)', title: 'Rock Night Live',        date: 'Apr 12, 2026', location: 'New York, NY',  price: '$25'  },
    { id: 3, category: 'Gaming', gradient: 'linear-gradient(135deg, #0a0a2e, #1a0a2e)', title: 'GameCon Expo 2026',      date: 'Jun 8, 2026',  location: 'Seattle, WA',   price: '$55'  },
];

const TICKET_HISTORY = [
    { id: 1, category: 'Theatre', gradient: 'linear-gradient(135deg, #2e0a1a, #1a0a2e)', title: 'Shakespeare Festival',  date: 'Apr 18, 2026', location: 'London, UK',      tickets: 2 },
    { id: 2, category: 'Art',     gradient: 'linear-gradient(135deg, #2e1a0a, #2e0a0a)', title: 'Modern Art Exhibition', date: 'May 15, 2026', location: 'Paris, France',   tickets: 1 },
    { id: 3, category: 'Food',    gradient: 'linear-gradient(135deg, #2e2a0a, #2e1a0a)', title: 'Street Food Festival',  date: 'May 22, 2026', location: 'Austin, TX',      tickets: 3 },
    { id: 4, category: 'Sport',   gradient: 'linear-gradient(135deg, #0a2e0a, #0a2e1a)', title: 'City Marathon 5K',      date: 'May 10, 2026', location: 'Chicago, IL',     tickets: 1 },
];

export const ProfilePage = () => {
    const { user } = useAuth();

    const [activeTab, setActiveTab]           = useState<'events' | 'tickets'>('events');
    const [bio, setBio]                       = useState('Event enthusiast and community organizer. I love bringing people together through great experiences.');
    const [bioEditing, setBioEditing]         = useState(false);
    const [nameInput, setNameInput]           = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword]       = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Placeholder — replace with real Google OAuth status when available
    const isGoogleConnected = false;

    const initial = user?.name?.[0]?.toUpperCase() || '?';

    return (
        <div className="profile-page">
            <Header />

            <div className="profile-content">

                {/* ── Info Card ──────────────────────────────────────── */}
                <section className="profile-card" style={{ animationDelay: '0s' }}>
                    <div className="profile-card-left">
                        <div className="profile-avatar">{initial}</div>
                        <div className="profile-identity">
                            <h1 className="profile-name">{user?.name}</h1>
                            <p className="profile-email">{user?.email}</p>
                        </div>
                    </div>

                    <div className="profile-bio-wrap">
                        {bioEditing ? (
                            <textarea
                                className="profile-bio-input"
                                value={bio}
                                onChange={e => setBio(e.target.value)}
                                rows={3}
                                autoFocus
                            />
                        ) : (
                            <p className="profile-bio">{bio}</p>
                        )}
                        <button
                            className="profile-bio-toggle"
                            onClick={() => setBioEditing(v => !v)}
                        >
                            {bioEditing ? 'Save bio' : 'Edit bio'}
                        </button>
                    </div>

                    <div className="profile-stats">
                        <div className="profile-stat">
                            <span className="profile-stat-value">{MY_CREATED_EVENTS.length}</span>
                            <span className="profile-stat-label">Events Created</span>
                        </div>
                        <div className="profile-stat-divider" />
                        <div className="profile-stat">
                            <span className="profile-stat-value">{TICKET_HISTORY.length}</span>
                            <span className="profile-stat-label">Events Attended</span>
                        </div>
                        <div className="profile-stat-divider" />
                        <div className="profile-stat">
                            <span className="profile-stat-value">
                                {TICKET_HISTORY.reduce((sum, e) => sum + e.tickets, 0)}
                            </span>
                            <span className="profile-stat-label">Tickets Purchased</span>
                        </div>
                    </div>
                </section>

                {/* ── Activity & Content ─────────────────────────────── */}
                <section className="profile-section" style={{ animationDelay: '0.08s' }}>
                    <h2 className="profile-section-title">Activity & Content</h2>

                    <div className="profile-tabs">
                        <button
                            className={`profile-tab${activeTab === 'events' ? ' active' : ''}`}
                            onClick={() => setActiveTab('events')}
                        >
                            Created Events
                        </button>
                        <button
                            className={`profile-tab${activeTab === 'tickets' ? ' active' : ''}`}
                            onClick={() => setActiveTab('tickets')}
                        >
                            Ticket History
                        </button>
                    </div>

                    {activeTab === 'events' && (
                        <div className="events-grid">
                            {MY_CREATED_EVENTS.map(event => (
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
                                            <button className="event-card-btn">Manage</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'tickets' && (
                        <div className="ticket-list">
                            {TICKET_HISTORY.map(entry => (
                                <div key={entry.id} className="ticket-item">
                                    <div className="ticket-item-thumb" style={{ background: entry.gradient }}>
                                        <span className="ticket-item-category">{entry.category}</span>
                                    </div>
                                    <div className="ticket-item-info">
                                        <div className="ticket-item-title">{entry.title}</div>
                                        <div className="ticket-item-meta">
                                            <span className="event-card-meta-row">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                                </svg>
                                                {entry.date}
                                            </span>
                                            <span className="event-card-meta-row">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                                                </svg>
                                                {entry.location}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ticket-item-badge">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                                        </svg>
                                        {entry.tickets} {entry.tickets === 1 ? 'ticket' : 'tickets'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Settings & Security ────────────────────────────── */}
                <section className="profile-section" style={{ animationDelay: '0.16s' }}>
                    <h2 className="profile-section-title">Settings & Security</h2>

                    <div className="settings-grid">

                        {/* Edit Profile */}
                        <div className="settings-card">
                            <h3 className="settings-card-title">Edit Profile</h3>
                            <form onSubmit={e => e.preventDefault()} className="settings-form">
                                <label className="settings-label">Display name</label>
                                <input
                                    className="settings-input"
                                    type="text"
                                    value={nameInput}
                                    onChange={e => setNameInput(e.target.value)}
                                    placeholder="Your name"
                                />
                                <label className="settings-label">Email</label>
                                <input
                                    className="settings-input"
                                    type="email"
                                    value={user?.email || ''}
                                    readOnly
                                    disabled
                                />
                                <button type="submit" className="settings-btn">Save changes</button>
                            </form>
                        </div>

                        {/* Change Password */}
                        <div className="settings-card">
                            <h3 className="settings-card-title">Change Password</h3>
                            <form onSubmit={e => e.preventDefault()} className="settings-form">
                                <label className="settings-label">Current password</label>
                                <input
                                    className="settings-input"
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <label className="settings-label">New password</label>
                                <input
                                    className="settings-input"
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <label className="settings-label">Confirm new password</label>
                                <input
                                    className="settings-input"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <button type="submit" className="settings-btn">Update password</button>
                            </form>
                        </div>

                        {/* Integrations */}
                        <div className="settings-card settings-card--full">
                            <h3 className="settings-card-title">Integrations</h3>
                            <div className="integration-row">
                                <div className="integration-info">
                                    <svg className="integration-icon" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <div>
                                        <div className="integration-name">Google Account</div>
                                        <div className="integration-desc">
                                            {isGoogleConnected
                                                ? 'Your Google account is linked. You can sign in with Google.'
                                                : 'Connect your Google account to enable one-click sign-in.'}
                                        </div>
                                    </div>
                                </div>
                                <div className="integration-right">
                                    <span className={`integration-badge ${isGoogleConnected ? 'connected' : 'disconnected'}`}>
                                        {isGoogleConnected ? 'Connected' : 'Not connected'}
                                    </span>
                                    <button className="settings-btn settings-btn--outline">
                                        {isGoogleConnected ? 'Disconnect' : 'Connect'}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

            </div>
        </div>
    );
};