import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import { TicketCard, type Ticket } from '../../components/TicketCard';
import { useAuth } from '../../context/AuthContext';
import { getUserTickets, setTicketHidden, type UserTicket } from '../../services/user';
import '../../styles/tickets.css';

export const TicketsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    const [loading, setLoading] = useState(true);
    const [raw, setRaw] = useState<UserTicket[]>([]);

    useEffect(() => {
        if (!user?.id) return;
        setLoading(true);
        getUserTickets(user.id)
            .then(setRaw)
            .catch(() => setRaw([]))
            .finally(() => setLoading(false));
    }, [user?.id]);

    const now = useMemo(() => new Date(), []);

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const handleHiddenChange = async (eventId: string, hidden: boolean) => {
        if (!user?.id) return;
        try {
            await setTicketHidden(user.id, eventId, hidden);
            setRaw(prev => prev.map(t => t.id === eventId ? { ...t, hidden } : t));
        } catch {
            toast.error('Failed to update visibility');
        }
    };

    const toTicketCard = (t: UserTicket): Ticket => {
        const d = new Date(t.date);
        const status: Ticket['status'] = d >= now ? 'active' : 'used';
        const unitPrice = t.price ? Number(t.price) : 0;
        const priceLabel = unitPrice === 0 ? 'Free' : `$${unitPrice.toFixed(unitPrice % 1 === 0 ? 0 : 2)}`;
        return {
            id: t.id,
            category: t.category,
            title: t.title,
            date: formatDate(t.date),
            time: formatTime(t.date),
            location: t.location,
            address: t.location,
            tickets: t.ticketCount,
            ticketCode: `TKT-${t.id.slice(0, 8).toUpperCase()}`,
            status,
            price: priceLabel,
            showInAttendees: !t.hidden,
            hidden: t.hidden,
        };
    };

    const upcoming = raw.filter(t => new Date(t.date) >= now).map(toTicketCard);
    const past = raw.filter(t => new Date(t.date) < now).map(toTicketCard);
    const list = activeTab === 'upcoming' ? upcoming : past;

    return (
        <div className="tickets-page">
            <Header />

            <div className="tickets-content">
                {/* ── Page heading ───────────────────────────────────── */}
                <div className="tickets-header">
                    <h1 className="tickets-heading">My <span>Tickets</span></h1>
                    <p className="tickets-subheading">
                        {upcoming.length} upcoming · {past.length} past
                    </p>
                </div>

                {/* ── Tabs ───────────────────────────────────────────── */}
                <div className="tickets-tabs">
                    <button
                        className={`tickets-tab${activeTab === 'upcoming' ? ' active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        Upcoming
                        {upcoming.length > 0 && (
                            <span className="tickets-tab-count">{upcoming.length}</span>
                        )}
                    </button>
                    <button
                        className={`tickets-tab${activeTab === 'past' ? ' active' : ''}`}
                        onClick={() => setActiveTab('past')}
                    >
                        Past
                        {past.length > 0 && (
                            <span className="tickets-tab-count">{past.length}</span>
                        )}
                    </button>
                </div>

                {/* ── Ticket list ────────────────────────────────────── */}
                {loading ? (
                    <div className="tickets-empty">
                        <p>Loading...</p>
                    </div>
                ) : list.length > 0 ? (
                    <div className="tickets-list">
                        {list.map(ticket => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                isPast={activeTab === 'past'}
                                onHiddenChange={(hidden) => handleHiddenChange(ticket.id, hidden)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="tickets-empty">
                        <svg
                            className="tickets-empty-icon"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#666"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                        </svg>
                        <p>No {activeTab} tickets</p>
                    </div>
                )}
            </div>
        </div>
    );
};