import { useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'react-qr-code';

export interface Ticket {
    id: string;
    eventId: string;
    category: string;
    title: string;
    date: string;
    time: string;
    location: string;
    address: string;
    tickets: number;
    ticketCode: string | null;
    coverUrl?: string | null;
    usedAt?: string | null;
    status: 'active' | 'used' | 'cancelled';
    price: string;
    showInAttendees: boolean;
    hidden: boolean;
}

const STATUS_LABELS: Record<Ticket['status'], string> = {
    active:    'Active',
    used:      'Used',
    cancelled: 'Cancelled',
};

interface TicketCardProps {
    ticket: Ticket;
    isPast?: boolean;
    onHiddenChange?: (hidden: boolean) => void;
}

export const TicketCard = ({ ticket, isPast = false, onHiddenChange }: TicketCardProps) => {
    const [showQr, setShowQr] = useState(false);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.address)}`;
    const qrValue = ticket.ticketCode
        ? `${window.location.origin}/validate?code=${ticket.ticketCode}`
        : '';

    return (
        <>
            <div className={`tkt-card tkt-card--${ticket.status}`}>
                {/* Cover image strip */}
                {ticket.coverUrl && (
                    <div
                        className="tkt-cover"
                        style={{ backgroundImage: `url(${ticket.coverUrl})` }}
                    />
                )}

                {/* Card body row */}
                <div className="tkt-inner">
                    {/* Main body */}
                    <div className="tkt-body">
                        <div className="tkt-top">
                            <span className="tkt-category">{ticket.category}</span>
                            <span className={`tkt-status tkt-status--${ticket.status}`}>
                                {STATUS_LABELS[ticket.status]}
                            </span>
                        </div>

                        <Link to={`/events/${ticket.eventId}`} className="tkt-title-link">
                            <p className="tkt-title">{ticket.title}</p>
                        </Link>

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
                            {ticket.location && (
                                <span className="tkt-meta-item">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    {ticket.location}
                                </span>
                            )}
                        </div>

                        {ticket.usedAt && (
                            <div className="tkt-checkin">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Checked in {new Date(ticket.usedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </div>
                        )}

                        <div className="tkt-footer">
                            <span className="tkt-price">{ticket.price}</span>
                            <Link to={`/events/${ticket.eventId}`} className="tkt-event-link">
                                View event
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                            </Link>
                        </div>
                    </div>

                    {/* Perforated separator */}
                    <div className="tkt-sep">
                        <div className="tkt-sep-line" />
                    </div>

                    {/* Right stub */}
                    <div className="tkt-stub">
                        {ticket.ticketCode ? (
                            <>
                                <span className="tkt-code">{ticket.ticketCode.slice(0, 8).toUpperCase()}</span>
                                <div className="tkt-qr-wrap">
                                    <QRCode value={qrValue} size={72} fgColor="#ff6b00" bgColor="transparent" />
                                </div>
                            </>
                        ) : (
                            <span className="tkt-code" style={{ color: '#444' }}>—</span>
                        )}

                        <div className="tkt-stub-actions">
                            {ticket.ticketCode && (
                                <button
                                    className="tkt-btn tkt-btn--primary"
                                    onClick={() => setShowQr(true)}
                                >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="4" height="4"/>
                                    </svg>
                                    Show QR
                                </button>
                            )}

                            <a
                                className="tkt-btn tkt-btn--ghost"
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                                </svg>
                                Directions
                            </a>

                            {onHiddenChange && (
                                <button
                                    className={`tkt-btn tkt-btn--ghost tkt-btn--hidden${ticket.hidden ? ' tkt-btn--hidden-active' : ''}`}
                                    onClick={() => onHiddenChange(!ticket.hidden)}
                                    title={ticket.hidden ? 'Show in attendee list' : 'Hide from attendee list'}
                                >
                                    {ticket.hidden ? (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                                        </svg>
                                    ) : (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    )}
                                    {ticket.hidden ? 'Hidden' : 'Visible'}
                                </button>
                            )}
                        </div>
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
                            <QRCode value={qrValue} size={180} fgColor="#ff6b00" bgColor="#1a1a1a" />
                        </div>

                        <p className="tkt-modal-code">{ticket.ticketCode?.slice(0, 8).toUpperCase()}</p>
                        <p className="tkt-modal-hint">Show this code at the venue entrance</p>
                    </div>
                </div>
            )}
        </>
    );
};
