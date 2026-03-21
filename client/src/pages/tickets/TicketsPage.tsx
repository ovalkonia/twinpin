import { useState } from 'react';
import Header from '../../components/Header/header';
import { TicketCard, type Ticket } from '../../components/TicketCard';
import '../../styles/tickets.css';

const TICKETS: Ticket[] = [
    {
        id: 1,
        category: 'Theatre',
        title:     'Shakespeare Festival',
        date:      'Apr 18, 2026',
        time:      '7:30 PM',
        location:  'London, UK',
        address:   'Royal Shakespeare Theatre, Stratford-upon-Avon, UK',
        tickets:   2,
        ticketCode: 'TKT-8821',
        status:    'active',
        price:     '$90',
    },
    {
        id: 2,
        category: 'Art',
        title:     'Modern Art Exhibition',
        date:      'May 15, 2026',
        time:      '10:00 AM',
        location:  'Paris, France',
        address:   'Centre Pompidou, Paris, France',
        tickets:   1,
        ticketCode: 'TKT-4432',
        status:    'active',
        price:     '$25',
    },
    {
        id: 3,
        category: 'Food',
        title:     'Street Food Festival',
        date:      'Jan 22, 2026',
        time:      '12:00 PM',
        location:  'Austin, TX',
        address:   '6th Street Austin TX USA',
        tickets:   3,
        ticketCode: 'TKT-7701',
        status:    'used',
        price:     '$60',
    },
    {
        id: 4,
        category: 'Sport',
        title:     'City Marathon 5K',
        date:      'Feb 10, 2026',
        time:      '8:00 AM',
        location:  'Chicago, IL',
        address:   'Grant Park Chicago IL USA',
        tickets:   1,
        ticketCode: 'TKT-3395',
        status:    'cancelled',
        price:     '$30',
    },
];

const now = new Date();

export const TicketsPage = () => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    const upcoming = TICKETS.filter(t => new Date(t.date) >= now);
    const past     = TICKETS.filter(t => new Date(t.date) <  now);
    const list     = activeTab === 'upcoming' ? upcoming : past;

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
                {list.length > 0 ? (
                    <div className="tickets-list">
                        {list.map(ticket => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                isPast={activeTab === 'past'}
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