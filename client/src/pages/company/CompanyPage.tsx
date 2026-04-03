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
import {
    IconGlobe,
    IconInstagram,
    IconLinkedIn,
    IconMapPin,
    IconTelegram,
    IconTikTok,
} from '../../assets/icons';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
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
                        {company.address && (() => {
                            const q = encodeURIComponent(company.address);
                            const hasKey = MAPS_KEY && MAPS_KEY !== 'your_google_maps_api_key';
                            const src = hasKey
                                ? `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${q}&zoom=15`
                                : `https://maps.google.com/maps?q=${q}&z=15&output=embed`;
                            return (
                                <iframe
                                    className="cp-map"
                                    src={src}
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Company location"
                                />
                            );
                        })()}

                        {hasContact && (
                            <div className="cp-contact-rows">
                                {company.website && (
                                    <a className="cp-contact-row" href={company.website} target="_blank" rel="noopener noreferrer">
                                        <span className="cp-contact-icon"><IconGlobe size={14} /></span>
                                        <span className="cp-contact-text">{company.website.replace(/^https?:\/\//, '')}</span>
                                    </a>
                                )}
                                {company.address && (
                                    <div className="cp-contact-row">
                                        <span className="cp-contact-icon"><IconMapPin size={14} /></span>
                                        <span className="cp-contact-text">{company.address}</span>
                                    </div>
                                )}
                                {company.email && (
                                    <a className="cp-contact-row" href={`mailto:${company.email}`}>
                                        <span className="cp-contact-icon">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                            </svg>
                                        </span>
                                        <span className="cp-contact-text">{company.email}</span>
                                    </a>
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

                {(company.linkedin || company.instagram || company.tiktok || company.telegram || company.website) && (
                    <aside className="cp-sidebar">
                        <div className="cp-sidebar-card">
                            <p className="cp-card-title">Find us on</p>
                            <div className="cp-social-links">
                                {company.linkedin && (
                                    <a className="cp-social-link cp-social-link--linkedin" href={company.linkedin} target="_blank" rel="noopener noreferrer">
                                        <IconLinkedIn size={16} />
                                        <span>LinkedIn</span>
                                    </a>
                                )}
                                {company.instagram && (
                                    <a className="cp-social-link cp-social-link--instagram" href={company.instagram} target="_blank" rel="noopener noreferrer">
                                        <IconInstagram size={16} />
                                        <span>Instagram</span>
                                    </a>
                                )}
                                {company.tiktok && (
                                    <a className="cp-social-link cp-social-link--tiktok" href={company.tiktok} target="_blank" rel="noopener noreferrer">
                                        <IconTikTok size={16} />
                                        <span>TikTok</span>
                                    </a>
                                )}
                                {company.telegram && (
                                    <a className="cp-social-link cp-social-link--telegram" href={company.telegram} target="_blank" rel="noopener noreferrer">
                                        <IconTelegram size={16} />
                                        <span>Telegram</span>
                                    </a>
                                )}
                                {company.website && (
                                    <a className="cp-social-link cp-social-link--website" href={company.website} target="_blank" rel="noopener noreferrer">
                                        <IconGlobe size={16} />
                                        <span>Website</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
};

