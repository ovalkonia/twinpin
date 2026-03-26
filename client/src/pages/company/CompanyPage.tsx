import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/header';
import {
    IconBuilding,
    IconGlobe,
    IconInstagram,
    IconLinkedIn,
    IconMapPin,
    IconPlus,
    IconTelegram,
    IconTikTok,
} from '../../assets/icons';
import '../../styles/company-page.css';
import '../../styles/company-register.css';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_COMPANY = {
    name: 'Twinpin Events Ltd.',
    slug: 'twinpin-events',
    logoUrl: null as string | null,
    coverUrl: null as string | null,
    description:
        'We create unforgettable live experiences that bring people together.\n\n' +
        'Founded in 2021, Twinpin Events has grown from a small local organizer into ' +
        'a platform trusted by thousands of attendees across Ukraine and beyond. ' +
        'Our team is passionate about music, technology, and community — ' +
        'and every event we run reflects that energy.\n\n' +
        'Whether you\'re here for a sold-out tech summit or an intimate jazz night, ' +
        'we promise an experience worth remembering.',
    categories: ['IT', 'Music', 'Art'],
    website: 'https://twinpin.com',
    email: 'hello@twinpin.com',
    address: 'Kyiv, Ukraine — Khreshchatyk St 22',
    linkedin: 'https://linkedin.com/company/twinpin',
    instagram: 'https://instagram.com/twinpin',
    tiktok: '',
    telegram: 'https://t.me/twinpin',
    stats: { eventsCreated: 14, totalAttendees: 3200 },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Company = typeof MOCK_COMPANY;

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
    <div className="cp-info-row">
        <span className="cp-info-icon">{icon}</span>
        <span className="cp-info-value">{children}</span>
    </div>
);

const SocialLinks: React.FC<{ company: Company }> = ({ company }) => {
    const links = [
        { key: 'linkedin',  label: 'LinkedIn',  icon: <IconLinkedIn size={15} />,  href: company.linkedin },
        { key: 'instagram', label: 'Instagram', icon: <IconInstagram size={15} />, href: company.instagram },
        { key: 'tiktok',    label: 'TikTok',    icon: <IconTikTok size={15} />,    href: company.tiktok },
        { key: 'telegram',  label: 'Telegram',  icon: <IconTelegram size={15} />,  href: company.telegram },
    ].filter(l => l.href);

    if (links.length === 0) return null;

    return (
        <div className="cp-sidebar-card" style={{ animationDelay: '0.14s' }}>
            <h3 className="cp-card-title">Social Links</h3>
            <div className="cp-social-grid">
                {links.map(l => (
                    <a
                        key={l.key}
                        className="cp-social-btn"
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {l.icon}
                        {l.label}
                    </a>
                ))}
            </div>
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export const CompanyPage: React.FC = () => {
    const c = MOCK_COMPANY;

    const hasContact = c.website || c.email || c.address;

    return (
        <div className="cp-page">
            <Header />

            {/* Cover */}
            <div
                className="cp-cover"
                style={c.coverUrl ? { backgroundImage: `url(${c.coverUrl})` } : undefined}
            >
                <div className="cp-cover-overlay" />
            </div>

            {/* Identity strip */}
            <div className="cp-identity-strip">
                <div className="cp-identity-inner">
                    <div className="cp-logo-wrap">
                        {c.logoUrl ? (
                            <img className="cp-logo" src={c.logoUrl} alt={`${c.name} logo`} />
                        ) : (
                            <div className="cp-logo-placeholder">
                                <IconBuilding size={36} />
                            </div>
                        )}
                    </div>

                    <div className="cp-identity-info">
                        <h1 className="cp-company-name">{c.name}</h1>
                        <div className="cp-categories">
                            {c.categories.map(cat => (
                                <span key={cat} className="cr-chip cr-chip--selected cr-chip--sm">
                                    {cat}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="cp-identity-actions">
                        <Link to="/events/create" className="cp-create-btn">
                            <IconPlus size={15} />
                            Create Event
                        </Link>
                        <Link to="/company/edit" className="cp-edit-btn">
                            Edit Profile
                        </Link>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="cp-layout">

                {/* Main */}
                <main className="cp-main">
                    <section className="cp-section" style={{ animationDelay: '0.06s' }}>
                        <h2 className="cp-section-title">About</h2>
                        {c.description ? (
                            <p className="cp-description">{c.description}</p>
                        ) : (
                            <p className="cp-description cp-description--empty">
                                No description provided yet.
                            </p>
                        )}
                    </section>
                </main>

                {/* Sidebar */}
                <aside className="cp-sidebar">

                    {/* Stats */}
                    <div className="cp-sidebar-card" style={{ animationDelay: '0.1s' }}>
                        <h3 className="cp-card-title">Activity</h3>
                        <div className="cp-stats-row">
                            <div className="cp-stat">
                                <span className="cp-stat-value">{c.stats.eventsCreated}</span>
                                <span className="cp-stat-label">Events Created</span>
                            </div>
                            <div className="cp-stat-divider" />
                            <div className="cp-stat">
                                <span className="cp-stat-value">
                                    {c.stats.totalAttendees >= 1000
                                        ? `${(c.stats.totalAttendees / 1000).toFixed(1)}k`
                                        : c.stats.totalAttendees}
                                </span>
                                <span className="cp-stat-label">Total Attendees</span>
                            </div>
                        </div>
                    </div>

                    {/* Contact info */}
                    {hasContact && (
                        <div className="cp-sidebar-card" style={{ animationDelay: '0.12s' }}>
                            <h3 className="cp-card-title">Contact</h3>
                            {c.website && (
                                <InfoRow icon={<IconGlobe size={15} />}>
                                    <a className="cp-info-link" href={c.website} target="_blank" rel="noopener noreferrer">
                                        {c.website.replace(/^https?:\/\//, '')}
                                    </a>
                                </InfoRow>
                            )}
                            {c.email && (
                                <InfoRow icon={<IconGlobe size={15} />}>
                                    <a className="cp-info-link" href={`mailto:${c.email}`}>{c.email}</a>
                                </InfoRow>
                            )}
                            {c.address && (
                                <InfoRow icon={<IconMapPin size={15} />}>
                                    {c.address}
                                </InfoRow>
                            )}
                        </div>
                    )}

                    {/* Social links */}
                    <SocialLinks company={c} />

                </aside>
            </div>
        </div>
    );
};