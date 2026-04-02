import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import {
    addCompanyMember,
    getCompanyMembers,
    getMyCompany,
    removeMember,
    type Company,
    type CompanyMember,
} from '../../services/company';
import '../../styles/company-page.css';
import '../../styles/company-register.css';
import { getUserEvents, type UserEvent } from '../../services/user';
import { deleteEvent } from '../../services/events';

export const CompanyPage: React.FC = () => {
    const [company, setCompany] = useState<Company | null>(null);
    const [members, setMembers] = useState<CompanyMember[]>([]);
    const [events, setEvents] = useState<UserEvent[]>([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getMyCompany()
            .then(async (c) => {
                setCompany(c);
                const list = await getCompanyMembers(c.id);
                setMembers(list);
                if (c.owner?.id) {
                    setEventsLoading(true);
                    try {
                        const ev = await getUserEvents(c.owner.id);
                        setEvents(ev);
                    } catch {
                        setEvents([]);
                    } finally {
                        setEventsLoading(false);
                    }
                } else {
                    setEvents([]);
                    setEventsLoading(false);
                }
            })
            .catch(() => setCompany(null))
            .finally(() => setLoading(false));
    }, []);

    const hasContact = useMemo(() => {
        if (!company) return false;
        return Boolean(company.website || company.email || company.address);
    }, [company]);

    const handleAddMember = async () => {
        if (!company) return;
        if (!inviteEmail.trim()) return;
        setInviteLoading(true);
        try {
            const created = await addCompanyMember(company.id, inviteEmail.trim());
            setMembers((prev) => [...prev, created]);
            setInviteEmail('');
            toast.success('Member invited');
        } catch {
            toast.error('Failed to invite member');
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!company) return;
        try {
            await removeMember(company.id, memberId);
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
            toast.success('Member removed');
        } catch {
            toast.error('Failed to remove member');
        }
    };

    if (loading) {
        return (
            <div className="cp-page">
                <Header />
                <div className="cp-layout">
                    <div className="cp-main">
                        <p>Loading company...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="cp-page">
                <Header />
                <div className="cp-layout">
                    <div className="cp-main">
                        <h1 className="cp-section-title">No registered company</h1>
                        <p>Create one to start publishing events.</p>
                        <Link className="cp-create-btn" to="/company/register">
                            Register company
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cp-page">
            <Header />

            <div className="cp-cover" style={company.coverUrl ? { backgroundImage: `url(${company.coverUrl})` } : undefined}>
                <div className="cp-cover-overlay" />
            </div>

            <div className="cp-identity-strip">
                <div className="cp-identity-inner">
                    <div className="cp-logo-wrap">
                        {company.logoUrl ? (
                            <img className="cp-logo" src={company.logoUrl} alt={`${company.name} logo`} />
                        ) : (
                            <div className="cp-logo-placeholder" />
                        )}
                    </div>

                    <div className="cp-identity-info">
                        <h1 className="cp-company-name">{company.name}</h1>
                        <div className="cp-categories">
                            {company.categories?.map((cat) => (
                                <span key={cat} className="cr-chip cr-chip--selected cr-chip--sm">
                                    {cat}
                                </span>
                            ))}
                        </div>
                        <div className="cp-stats">
                            <span>{company.stats?.eventsCreated ?? 0} events</span>
                            <span>{company.stats?.totalAttendees ?? 0} attendees</span>
                        </div>
                    </div>

                    <div className="cp-identity-actions">
                        <Link to="/events/create" className="cp-create-btn">
                            Create Event
                        </Link>
                        <Link to="/company/edit" className="cp-edit-btn">
                            Edit Profile
                        </Link>
                    </div>
                </div>
            </div>

            <div className="cp-layout">
                <main className="cp-main">
                    <section className="cp-section">
                        <h2 className="cp-section-title">About</h2>
                        {company.description ? (
                            <p className="cp-description">{company.description}</p>
                        ) : (
                            <p className="cp-description cp-description--empty">No description provided yet.</p>
                        )}
                        {hasContact && (
                            <div className="cp-contact">
                                {company.website && (
                                    <p>
                                        <strong>Website:</strong> {company.website}
                                    </p>
                                )}
                                {company.address && (
                                    <p>
                                        <strong>Address:</strong> {company.address}
                                    </p>
                                )}
                                {company.email && (
                                    <p>
                                        <strong>Email:</strong> {company.email}
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    <section className="cp-section">
                        <div className="cp-members-header">
                            <h2 className="cp-section-title" style={{ marginBottom: 0 }}>
                                Events
                            </h2>
                        </div>

                        {eventsLoading ? (
                            <p>Loading events…</p>
                        ) : events.length === 0 ? (
                            <p>No events yet.</p>
                        ) : (
                            <div className="events-grid">
                                {events.map((event) => (
                                    <div key={event.id} className="event-card">
                                        <div
                                            className="event-card-image"
                                            style={
                                                event.coverUrl
                                                    ? {
                                                        backgroundImage: `url(${event.coverUrl})`,
                                                        backgroundSize: 'cover',
                                                        backgroundPosition: 'center',
                                                    }
                                                    : { background: 'linear-gradient(135deg, #1a1a2e, #0a0a1a)' }
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
                                                    {event.date}
                                                </span>
                                                <span className="event-card-meta-row">
                                                    {event.location}
                                                </span>
                                            </div>
                                            <div className="event-card-footer">
                                                <span className="event-card-price">
                                                    {event.price}
                                                </span>
                                                <Link
                                                    to={`/events/${event.id}/edit`}
                                                    className="event-card-btn"
                                                >
                                                    Manage
                                                </Link>
                                                <button
                                                    className="event-card-btn"
                                                    type="button"
                                                    style={{
                                                        background: 'transparent',
                                                        border:
                                                            '1px solid rgba(255,107,0,0.4)',
                                                        color: '#ff6b00',
                                                    }}
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        const ok = window.confirm('Delete this event? This cannot be undone.');
                                                        if (!ok) return;
                                                        try {
                                                            await deleteEvent(event.id);
                                                            setEvents((prev) =>
                                                                prev.filter(
                                                                    (x) =>
                                                                        x.id !== event.id,
                                                                ),
                                                            );
                                                            toast.success('Event deleted');
                                                        } catch {
                                                            toast.error('Failed to delete event');
                                                        }
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="cp-section">
                        <div className="cp-members-header">
                            <h2 className="cp-section-title" style={{ marginBottom: 0 }}>
                                Members
                            </h2>
                        </div>

                        <div className="cp-member-invite">
                            <input
                                className="cr-input"
                                value={inviteEmail}
                                placeholder="colleague@email.com"
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                            <button className="cr-btn cr-btn--primary" onClick={handleAddMember} disabled={inviteLoading}>
                                Invite
                            </button>
                        </div>

                        <div className="cp-member-list">
                            {members.map((m) => (
                                <div key={m.id} className="cp-member-row">
                                    <div className="cp-member-avatar">{m.name?.charAt(0)?.toUpperCase()}</div>
                                    <div className="cp-member-info">
                                        <div className="cp-member-name">{m.name}</div>
                                        <div className="cp-member-email">{m.email}</div>
                                    </div>
                                    <button className="cp-member-remove" onClick={() => handleRemoveMember(m.id)}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                            {members.length === 0 && <p>No members yet.</p>}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

