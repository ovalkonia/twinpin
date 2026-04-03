import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import { useAuth } from '../../context/AuthContext';
import { getUserById, getUserEvents, getUserTickets, updateUserAvatar, type UserProfile, UserEvent, type UserTicket } from '../../services/user';
import { deleteEvent } from '../../services/events';
import { IconCamera } from '../../assets/icons';
import '../../styles/profile.css';

const DEFAULT_COVER = 'linear-gradient(135deg, #1a1a2e, #0a0a1a)';

export const ProfilePage = () => {
    const { userId: routeUserId } = useParams<{ userId?: string }>();
    const { user: currentUser, updateUser } = useAuth();

    const resolvedUserId = routeUserId ?? currentUser?.id;

    const [profileUser, setProfileUser]       = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError]     = useState(false);

    const [createdEvents, setCreatedEvents]   = useState<UserEvent[]>([]);
    const [eventsLoading, setEventsLoading]   = useState(true);

    const [ticketHistory, setTicketHistory]   = useState<UserTicket[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState(true);

    const [activeTab, setActiveTab] = useState<'events' | 'tickets'>('events');

    const isOwnProfile = Boolean(currentUser?.id && resolvedUserId && currentUser.id === resolvedUserId);

    const avatarInputRef = useRef<HTMLInputElement>(null);
    const [avatarObjectUrl, setAvatarObjectUrl] = useState<string | null>(null);
    const [savingAvatar, setSavingAvatar] = useState(false);

    const avatarSrc = avatarObjectUrl ?? profileUser?.avatarUrl ?? null;

    useEffect(() => {
        if (!resolvedUserId) return;

        setProfileLoading(true);
        setProfileError(false);
        setEventsLoading(true);
        setTicketsLoading(true);

        getUserById(resolvedUserId)
            .then(data => {
                setProfileUser(data);
                setAvatarObjectUrl(null);
            })
            .catch(() => setProfileError(true))
            .finally(() => setProfileLoading(false));

        getUserEvents(resolvedUserId)
            .then(setCreatedEvents)
            .catch(() => setCreatedEvents([]))
            .finally(() => setEventsLoading(false));

        getUserTickets(resolvedUserId)
            .then(setTicketHistory)
            .catch(() => setTicketHistory([]))
            .finally(() => setTicketsLoading(false));
    }, [resolvedUserId]);

    useEffect(() => {
        return () => {
            if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
        };
    }, [avatarObjectUrl]);

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!resolvedUserId) return;
        if (savingAvatar) return;
        if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
        setAvatarObjectUrl(URL.createObjectURL(file));
        setSavingAvatar(true);
        updateUserAvatar(resolvedUserId, file)
            .then((updated) => {
                setProfileUser(updated);
                setAvatarObjectUrl(null);
                if (isOwnProfile) updateUser({ avatarUrl: updated.avatarUrl });
                toast.success('Avatar updated');
            })
            .catch(() => {
                toast.error('Failed to update avatar');
                setAvatarObjectUrl(null);
            })
            .finally(() => setSavingAvatar(false));
    };

    const initial = profileUser?.name?.[0]?.toUpperCase() || '?';
    const totalTickets = ticketHistory.reduce((sum, t) => sum + t.ticketCount, 0);

    return (
        <div className="profile-page">
            <Header />

            <div className="profile-content">

                {profileLoading && (
                    <div className="profile-loading">Loading profile…</div>
                )}

                {profileError && !profileLoading && (
                    <div className="profile-error">User not found.</div>
                )}

                {!profileLoading && !profileError && (
                <>

                {/* ── Info Card ──────────────────────────────────────── */}
                <section className="profile-card" style={{ animationDelay: '0s' }}>
                    <div className="profile-card-left">
                        <div className="profile-avatar-wrap">
                            <div className="profile-avatar">
                                {avatarSrc
                                    ? <img className="profile-avatar-img" src={avatarSrc} alt="Avatar" />
                                    : initial}
                            </div>
                            {isOwnProfile && <>
                                <button
                                    type="button"
                                    className="profile-avatar-change"
                                    onClick={() => avatarInputRef.current?.click()}
                                    aria-label="Change avatar"
                                >
                                    <IconCamera size={14} />
                                </button>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleAvatarChange}
                                />
                            </>}
                        </div>
                        <div className="profile-identity">
                            <h1 className="profile-name">{profileUser?.name}</h1>
                            {isOwnProfile && <p className="profile-email">{profileUser?.email}</p>}
                        </div>
                    </div>

                    {isOwnProfile && (
                        <div className="profile-card-actions">
                            <Link to="/profile/edit" className="profile-edit-btn">Edit Profile</Link>
                        </div>
                    )}

                    <div className="profile-stats">
                        <div className="profile-stat">
                            <span className="profile-stat-value">
                                {eventsLoading ? '—' : createdEvents.length}
                            </span>
                            <span className="profile-stat-label">Events Created</span>
                        </div>
                        <div className="profile-stat-divider" />
                        <div className="profile-stat">
                            <span className="profile-stat-value">
                                {ticketsLoading ? '—' : ticketHistory.length}
                            </span>
                            <span className="profile-stat-label">Events Attended</span>
                        </div>
                        <div className="profile-stat-divider" />
                        <div className="profile-stat">
                            <span className="profile-stat-value">
                                {ticketsLoading ? '—' : totalTickets}
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
                        eventsLoading ? (
                            <p className="profile-tab-loading">Loading events…</p>
                        ) : createdEvents.length === 0 ? (
                            <p className="profile-tab-empty">No events created yet.</p>
                        ) : (
                            <div className="events-grid">
                                {createdEvents.map(event => (
                                    <div key={event.id} className="event-card">
                                        <div
                                            className="event-card-image"
                                            style={event.coverUrl
                                                ? { backgroundImage: `url(${event.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                                : { background: DEFAULT_COVER }}
                                        >
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
                                                <Link to={`/events/${event.id}/edit`} className="event-card-btn">Manage</Link>
                                                {isOwnProfile && (
                                                    <button
                                                        className="event-card-btn"
                                                        type="button"
                                                        style={{ background: 'transparent', border: '1px solid rgba(255,107,0,0.4)', color: '#ff6b00' }}
                                                        onClick={async (e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            const ok = window.confirm('Delete this event? This cannot be undone.');
                                                            if (!ok) return;
                                                            try {
                                                                await deleteEvent(event.id);
                                                                setCreatedEvents(prev => prev.filter(x => x.id !== event.id));
                                                                toast.success('Event deleted');
                                                            } catch {
                                                                toast.error('Failed to delete event');
                                                            }
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}

                    {activeTab === 'tickets' && (
                        ticketsLoading ? (
                            <p className="profile-tab-loading">Loading tickets…</p>
                        ) : ticketHistory.length === 0 ? (
                            <p className="profile-tab-empty">No tickets purchased yet.</p>
                        ) : (
                            <div className="ticket-list">
                                {ticketHistory.map(entry => (
                                    <div key={entry.id} className="ticket-item">
                                        <div
                                            className="ticket-item-thumb"
                                            style={{ background: DEFAULT_COVER }}
                                        >
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
                                            {entry.ticketCount} {entry.ticketCount === 1 ? 'ticket' : 'tickets'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </section>


                </>
                )}

            </div>
        </div>
    );
};