import { useState } from 'react';

export interface Ticket {
    id: number;
    category: string;
    title: string;
    date: string;
    time: string;
    location: string;
    address: string;
    tickets: number;
    ticketCode: string;
    status: 'active' | 'used' | 'cancelled';
    price: string;
}

const STATUS_LABELS: Record<Ticket['status'], string> = {
    active:    'Active',
    used:      'Used',
    cancelled: 'Cancelled',
};

/* ── Decorative QR graphic (visual only) ─────────────────────── */
const QrGraphic = ({ code, size = 80 }: { code: string; size?: number }) => {
    const seed = code.split('').reduce((a   , c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 7);
    const N = 9;
    const cells = Array.from({ length: N }, (_, r) =>
        Array.from({ length: N }, (_, c) => {
            if (r < 3 && c < 3) return true;
            if (r < 3 && c > N - 4) return true;
            if (r > N - 4 && c < 3) return true;
            return (((seed ^ (r * 17 + c * 31)) * 2654435769) >>> 0) % 3 !== 0;
        })
    );
    const cell = size / N;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {cells.map((row, r) =>
                row.map((on, c) =>
                    on ? (
                        <rect
                            key={`${r}-${c}`}
                            x={c * cell + 0.5}
                            y={r * cell + 0.5}
                            width={cell - 1}
                            height={cell - 1}
                            fill="#ff6b00"
                            rx="1"
                        />
                    ) : null
                )
            )}
        </svg>
    );
};

interface TicketCardProps {
    ticket: Ticket;
    isPast?: boolean;
}

export const TicketCard = ({ ticket, isPast = false }: TicketCardProps) => {
    const [showQr, setShowQr] = useState(false);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.address)}`;

    return (
        <>
            <div className={`tkt-card tkt-card--${ticket.status}`}>
                {/* Main body */}
                <div className="tkt-body">
                    <div className="tkt-top">
                        <span className="tkt-category">{ticket.category}</span>
                        <span className={`tkt-status tkt-status--${ticket.status}`}>
                            {STATUS_LABELS[ticket.status]}
                        </span>
                    </div>

                    <p className="tkt-title">{ticket.title}</p>

                    <div className="tkt-meta">
                        <span className="tkt-meta-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            {ticket.date}
                        </span>
                        <span className="tkt-meta-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            {ticket.time}
                        </span>
                        <span className="tkt-meta-item">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            {ticket.location}
                        </span>
                    </div>

                    <div className="tkt-footer">
                        <span className="tkt-count">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
                            </svg>
                            {ticket.tickets} {ticket.tickets === 1 ? 'ticket' : 'tickets'}
                        </span>
                        <span className="tkt-price">{ticket.price}</span>
                    </div>
                </div>

                {/* Perforated separator */}
                <div className="tkt-sep">
                    <div className="tkt-sep-line" />
                </div>

                {/* Right stub */}
                <div className="tkt-stub">
                    <span className="tkt-code">{ticket.ticketCode}</span>

                    <div className="tkt-qr-wrap">
                        <QrGraphic code={ticket.ticketCode} size={72} />
                    </div>

                    <div className="tkt-stub-actions">
                        <button
                            className="tkt-btn tkt-btn--primary"
                            onClick={() => setShowQr(true)}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="4" height="4"/>
                            </svg>
                            View QR Code
                        </button>

                        <a
                            className="tkt-btn tkt-btn--ghost"
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            Get Directions
                        </a>
                    </div>
                </div>
            </div>

            {/* QR Modal */}
            {showQr && (
                <div className="tkt-modal-overlay" onClick={() => setShowQr(false)}>
                    <div className="tkt-modal" onClick={e => e.stopPropagation()}>
                        <button
                            className="tkt-modal-close"
                            onClick={() => setShowQr(false)}
                            aria-label="Close"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>

                        <span className={`tkt-status tkt-status--${ticket.status}`} style={{ alignSelf: 'center' }}>
                            {STATUS_LABELS[ticket.status]}
                        </span>

                        <p className="tkt-modal-title">{ticket.title}</p>
                        <p className="tkt-modal-sub">{ticket.date} · {ticket.time}</p>

                        <div className="tkt-modal-graphic">
                            <QrGraphic code={ticket.ticketCode} size={180} />
                        </div>

                        <p className="tkt-modal-code">{ticket.ticketCode}</p>
                        <p className="tkt-modal-hint">Show this code at the venue entrance</p>
                    </div>
                </div>
            )}
        </>
    );
};