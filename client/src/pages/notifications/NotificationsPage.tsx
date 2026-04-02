import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header/header';
import { IconBell, IconCalendar, IconCheck, IconClose, IconMapPin, IconTicket } from '../../assets/icons';
import '../../styles/notifications.css';
import api from '../../services/api';

type NotificationCategory = 'event' | 'ticket' | 'system';
type NotificationType = string;

interface FullNotification {
    id: string;
    category: NotificationCategory;
    type: NotificationType;
    title: string;
    message: string;
    event_id?: string;
    event_title?: string;
    ticket_id?: string;
    location?: { lat: number; lng: number };
    date: string;
    read: boolean;
}

const t = (y: number, mo: number, d: number, h: number, mi = 0) =>
    new Date(Date.UTC(y, mo - 1, d, h, mi)).toISOString();

const MOCK_NOTIFICATIONS: FullNotification[] = [
    {
        id: '1',
        category: 'event',
        type: 'event_time_change',
        title: 'Event time changed',
        message: 'Jazz Night 2026 has been rescheduled from 7:00 PM to 9:00 PM.',
        event_id: '42',
        event_title: 'Jazz Night 2026',
        date: t(2026, 3, 23, 10, 30),
        read: false,
    },
    {
        id: '2',
        category: 'ticket',
        type: 'ticket_payment_confirmed',
        title: 'Payment confirmed',
        message: 'Your ticket for Tech Summit 2026 has been successfully paid.',
        ticket_id: 'T-1023',
        date: t(2026, 3, 23, 8, 15),
        read: false,
    },
    {
        id: '3',
        category: 'system',
        type: 'system_security',
        title: 'New login detected',
        message: "We noticed a new login to your account from Kyiv, Ukraine. If this wasn't you, secure your account.",
        date: t(2026, 3, 23, 6, 0),
        read: true,
    },
    {
        id: '4',
        category: 'event',
        type: 'event_place_change',
        title: 'Venue changed',
        message: 'Art Exhibition venue has moved to Mystetskyi Arsenal. New address: Lavrska St 10–12.',
        event_id: '17',
        event_title: 'Art Exhibition',
        location: { lat: 50.4391, lng: 30.5564 },
        date: t(2026, 3, 22, 14, 0),
        read: false,
    },
    {
        id: '5',
        category: 'ticket',
        type: 'ticket_reminder',
        title: 'Event starts in 24 hours',
        message: "Don't forget! Tech Summit 2026 starts tomorrow at 10:00 AM. Check your ticket for entry details.",
        ticket_id: 'T-1023',
        date: t(2026, 3, 22, 11, 0),
        read: true,
    },
    {
        id: '6',
        category: 'event',
        type: 'event_cancelled',
        title: 'Event cancelled',
        message: 'Unfortunately, Open Air Cinema has been cancelled by the organizer. A full refund has been initiated.',
        event_id: '88',
        event_title: 'Open Air Cinema',
        date: t(2026, 3, 22, 9, 0),
        read: true,
    },
    {
        id: '7',
        category: 'system',
        type: 'system_rules',
        title: 'Platform rules updated',
        message: 'Our community guidelines have been updated. Please review the changes before your next event.',
        date: t(2026, 3, 20, 16, 0),
        read: true,
    },
    {
        id: '8',
        category: 'ticket',
        type: 'ticket_reminder',
        title: 'Event starts in 3 hours',
        message: 'Jazz Night starts in 3 hours at Club 44. Doors open at 8:00 PM.',
        ticket_id: 'T-987',
        date: t(2026, 3, 19, 7, 0),
        read: true,
    },
    {
        id: '9',
        category: 'event',
        type: 'event_time_change',
        title: 'Event time changed',
        message: 'Startup Pitch Battle has been moved from Thursday to Friday at 7:00 PM.',
        event_id: '55',
        event_title: 'Startup Pitch Battle',
        date: t(2026, 3, 18, 10, 0),
        read: true,
    },
    {
        id: '10',
        category: 'system',
        type: 'system_security',
        title: 'Password changed successfully',
        message: "Your account password was changed on 10 March. If this wasn't you, contact support immediately.",
        date: t(2026, 3, 10, 10, 0),
        read: true,
    },
];

type FilterType = 'all' | 'unread' | 'event' | 'ticket' | 'system';

const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'event', label: 'Events' },
    { key: 'ticket', label: 'Tickets' },
    { key: 'system', label: 'System' },
];

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function groupByDate(items: FullNotification[]) {
    const now = new Date();
    const yest = new Date(now);
    yest.setDate(yest.getDate() - 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const today: FullNotification[] = [];
    const yesterday: FullNotification[] = [];
    const lastWeek: FullNotification[] = [];
    const earlier: FullNotification[] = [];

    for (const n of items) {
        const d = new Date(n.date);
        if (isSameDay(d, now)) today.push(n);
        else if (isSameDay(d, yest)) yesterday.push(n);
        else if (d > weekAgo) lastWeek.push(n);
        else earlier.push(n);
    }

    return { today, yesterday, lastWeek, earlier };
}

function formatRelative(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

const ICON_MAP: Record<NotificationCategory, React.ReactNode> = {
    event: <IconCalendar size={18} />,
    ticket: <IconTicket size={18} />,
    system: <IconBell size={18} />,
};

const ICON_CLASS: Record<NotificationCategory, string> = {
    event: 'notif-icon--event',
    ticket: 'notif-icon--ticket',
    system: 'notif-icon--system',
};

export const NotificationsPage: React.FC = () => {
    const [notifications, setNotifications] = useState<FullNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Set<string>>(new Set());

    useEffect(() => {
        setLoading(true);
        api.get<FullNotification[]>('/notifications')
            .then(res => setNotifications(res.data))
            .catch(() => setNotifications([]))
            .finally(() => setLoading(false));
    }, []);

    const counts = useMemo(() => ({
        all: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        event: notifications.filter(n => n.category === 'event').length,
        ticket: notifications.filter(n => n.category === 'ticket').length,
        system: notifications.filter(n => n.category === 'system').length,
    }), [notifications]);

    const filtered = useMemo(() => {
        let result = notifications;
        if (activeFilter === 'unread') result = result.filter(n => !n.read);
        else if (activeFilter !== 'all') result = result.filter(n => n.category === activeFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(n =>
                n.title.toLowerCase().includes(q) ||
                n.message.toLowerCase().includes(q) ||
                n.event_title?.toLowerCase().includes(q)
            );
        }
        return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [notifications, activeFilter, search]);

    const grouped = useMemo(() => groupByDate(filtered), [filtered]);

    const toggleSelect = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const markRead = async (id: string) => {
        try {
            await api.patch(`/notifications/${id}/read`);
        } finally {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }
    };

    const deleteOne = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`);
        } finally {
            setNotifications(prev => prev.filter(n => n.id !== id));
            setSelected(prev => { const next = new Set(prev); next.delete(id); return next; });
        }
    };

    const markSelectedRead = async () => {
        const ids = Array.from(selected);
        await Promise.all(ids.map((id) => api.patch(`/notifications/${id}/read`).catch(() => undefined)));
        setNotifications(prev => prev.map(n => selected.has(n.id) ? { ...n, read: true } : n));
        setSelected(new Set());
    };

    const deleteSelected = async () => {
        const ids = Array.from(selected);
        await Promise.all(ids.map((id) => api.delete(`/notifications/${id}`).catch(() => undefined)));
        setNotifications(prev => prev.filter(n => !selected.has(n.id)));
        setSelected(new Set());
    };

    const renderGroup = (label: string, items: FullNotification[]) => {
        if (items.length === 0) return null;
        return (
            <div className="notif-group" key={label}>
                <div className="notif-group-label">{label}</div>
                <div className="notif-list">
                    {items.map((n, i) => (
                        <div
                            key={n.id}
                            className={[
                                'notif-item',
                                n.read ? 'notif-item--read' : '',
                                selected.has(n.id) ? 'notif-item--selected' : '',
                            ].join(' ').trim()}
                            style={{ animationDelay: `${i * 0.04}s` }}
                            onClick={() => markRead(n.id)}
                        >
                            <label className="notif-checkbox-wrap" onClick={e => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="notif-checkbox"
                                    checked={selected.has(n.id)}
                                    onChange={e => toggleSelect(n.id, e as unknown as React.MouseEvent)}
                                />
                                <span className="notif-checkbox-custom" />
                            </label>

                            <span className={`notif-unread-dot${n.read ? ' notif-unread-dot--hidden' : ''}`} />

                            <div className={`notif-icon ${ICON_CLASS[n.category]}`}>
                                {ICON_MAP[n.category]}
                            </div>

                            <div className="notif-body">
                                <p className="notif-title">{n.title}</p>
                                <p className="notif-message">{n.message}</p>
                                <p className="notif-time">{formatRelative(n.date)}</p>
                            </div>

                            <div className="notif-actions" onClick={e => e.stopPropagation()}>
                                {n.category === 'ticket' && (
                                    <Link to="/tickets" className="notif-action-btn">
                                        <IconTicket size={13} />
                                        View ticket
                                    </Link>
                                )}
                                {n.location && (
                                    <button
                                        className="notif-action-btn"
                                        onClick={() =>
                                            window.open(
                                                `https://maps.google.com/?q=${n.location!.lat},${n.location!.lng}`,
                                                '_blank'
                                            )
                                        }
                                    >
                                        <IconMapPin size={13} />
                                        Open map
                                    </button>
                                )}
                                <button
                                    className="notif-delete-btn"
                                    aria-label="Delete"
                                    onClick={e => deleteOne(n.id, e)}
                                >
                                    <IconClose size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="notif-page">
            <Header />
            <div className="notif-layout">
                {/* Sidebar */}
                <aside className="notif-sidebar">
                    <h2 className="notif-sidebar-title">
                        Notifications
                        {counts.unread > 0 && (
                            <span className="notif-sidebar-badge">{counts.unread}</span>
                        )}
                    </h2>

                    <nav className="notif-filter-list">
                        {FILTERS.map(f => (
                            <button
                                key={f.key}
                                className={`notif-filter-item${activeFilter === f.key ? ' notif-filter-item--active' : ''}`}
                                onClick={() => setActiveFilter(f.key)}
                            >
                                <span className="notif-filter-label">{f.label}</span>
                                <span className="notif-filter-count">{counts[f.key]}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main */}
                <main className="notif-main">
                    <div className="notif-search-wrap">
                        <input
                            type="text"
                            className="notif-search"
                            placeholder="Search by event name or keyword..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {selected.size > 0 && (
                        <div className="notif-bulk-bar">
                            <span className="notif-bulk-count">{selected.size} selected</span>
                            <button className="notif-bulk-btn notif-bulk-btn--outline" onClick={markSelectedRead}>
                                <IconCheck size={14} />
                                Mark as read
                            </button>
                            <button className="notif-bulk-btn notif-bulk-btn--danger" onClick={deleteSelected}>
                                <IconClose size={14} />
                                Delete
                            </button>
                        </div>
                    )}

                    {filtered.length === 0 ? (
                        <div className="notif-empty">
                            <div className="notif-empty-icon">
                                <IconBell size={32} />
                            </div>
                            <p className="notif-empty-text">No notifications found</p>
                        </div>
                    ) : (
                        <div className="notif-feed">
                            {renderGroup('Today', grouped.today)}
                            {renderGroup('Yesterday', grouped.yesterday)}
                            {renderGroup('Last week', grouped.lastWeek)}
                            {renderGroup('Earlier', grouped.earlier)}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};