import React, { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import { useAuth } from '../../context/AuthContext';
import { getUserById, getUserEvents, getUserTickets, updateUser, updateUserAvatar, type UserProfile, UserEvent, type UserTicket } from '../../services/user';
import { deleteEvent } from '../../services/events';
import { IconCamera } from '../../assets/icons';
import '../../styles/profile.css';

const DEFAULT_COVER = 'linear-gradient(135deg, #1a1a2e, #0a0a1a)';

export const ProfilePage = () => {
    const { userId: routeUserId } = useParams<{ userId?: string }>();
    const { user: currentUser } = useAuth();

    const resolvedUserId = routeUserId ?? currentUser?.id;

    const [profileUser, setProfileUser]       = useState<UserProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError]     = useState(false);

    const [createdEvents, setCreatedEvents]   = useState<UserEvent[]>([]);
    const [eventsLoading, setEventsLoading]   = useState(true);

    const [ticketHistory, setTicketHistory]   = useState<UserTicket[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState(true);

    const [activeTab, setActiveTab]             = useState<'events' | 'tickets'>('events');
    const [bio, setBio]                         = useState('');
    const [bioEditing, setBioEditing]           = useState(false);
    const [nameInput, setNameInput]             = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword]         = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

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
                setNameInput(data.name);
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
                toast.success('Avatar updated');
            })
            .catch(() => {
                toast.error('Failed to update avatar');
                setAvatarObjectUrl(null);
            })
            .finally(() => setSavingAvatar(false));
    };

    const handleSaveProfile = async () => {
        if (!resolvedUserId) return;
        setSavingProfile(true);
        try {
            const updated = await updateUser(resolvedUserId, { name: nameInput });
            setProfileUser(updated);
            toast.success('Profile updated');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!resolvedUserId) return;
        if (!newPassword || !confirmPassword) {
            toast.error('Please enter a new password');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setSavingPassword(true);
        try {
            await updateUser(resolvedUserId, { password: newPassword });
            toast.success('Password updated');
            setNewPassword('');
            setConfirmPassword('');
            setCurrentPassword('');
        } catch {
            toast.error('Failed to update password');
        } finally {
            setSavingPassword(false);
        }
    };

    const isGoogleConnected = false;
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
                            <p className="profile-email">{profileUser?.email}</p>
                        </div>
                    </div>

                    {isOwnProfile && (
                        <div className="profile-bio-wrap">
                            <p className="profile-bio" style={{ color: '#555' }}>
                                Bio editing is not available yet.
                            </p>
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
                                                <span className="event-card-price">{event.price}</span>
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

                {/* ── Settings & Security (own profile only) ─────────── */}
                {isOwnProfile && (
                <section className="profile-section" style={{ animationDelay: '0.16s' }}>
                    <h2 className="profile-section-title">Settings & Security</h2>

                    <div className="settings-grid">

                        {/* Edit Profile */}
                        <div className="settings-card">
                            <h3 className="settings-card-title">Edit Profile</h3>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSaveProfile();
                                }}
                                className="settings-form"
                            >
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
                                    value={profileUser?.email || ''}
                                    readOnly
                                    disabled
                                />
                                <button
                                    type="submit"
                                    className="settings-btn"
                                    disabled={savingProfile}
                                >
                                    {savingProfile ? 'Saving…' : 'Save changes'}
                                </button>
                            </form>
                        </div>

                        {/* Change Password */}
                        <div className="settings-card">
                            <h3 className="settings-card-title">Change Password</h3>
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleUpdatePassword();
                                }}
                                className="settings-form"
                            >
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
                                <button
                                    type="submit"
                                    className="settings-btn"
                                    disabled={savingPassword}
                                >
                                    {savingPassword ? 'Updating…' : 'Update password'}
                                </button>
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
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z" />
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
                )}

                </>
                )}

            </div>
        </div>
    );
};