import { useState } from 'react';
import type { TicketTier } from '../../services/events';

interface Props {
    tickets: TicketTier[];
    isBooked: boolean;
    isTicketUsed?: boolean;
    isPast?: boolean;
    isAuth: boolean;
    loading: boolean;
    onCheckout: (ticketId: string, qty: number) => void;
    onCancel: () => void;
    onAuthRequired: () => void;
}

export default function EventTicketSelector({
    tickets,
    isBooked,
    isTicketUsed = false,
    isPast = false,
    isAuth,
    loading,
    onCheckout,
    onCancel,
    onAuthRequired,
}: Props) {
    const defaultTier = tickets.find(t => t.isDefault) ?? tickets[0];
    const [selectedId, setSelectedId] = useState<string>(defaultTier?.id ?? '');
    const [qty, setQty] = useState(1);

    const selected = tickets.find(t => t.id === selectedId);
    const maxQty = selected?.availableSpots != null ? Math.min(selected.availableSpots, 10) : 10;

    const unitPrice = selected?.price ?? 0;
    const subtotal  = unitPrice * qty;
    const fee       = Math.round(subtotal * 0.05 * 100) / 100;
    const total     = subtotal + fee;

    const currency = selected?.currency ?? 'EUR';
    const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;

    const allSoldOut = tickets.length > 0 && tickets.every(t => t.availableSpots === 0);

    if (isBooked) {
        return (
            <div className="ev-ticket-selector">
                <div className="ev-ticket-booked">
                    <span className="ev-ticket-booked-check">✓</span>
                    <span>You're going!</span>
                </div>
                {allSoldOut && (
                    <div className="ev-ticket-all-soldout" style={{ marginTop: 12 }}>
                        <div className="ev-ticket-all-soldout-icon">🎟</div>
                        <div className="ev-ticket-all-soldout-title">Sold Out</div>
                        <div className="ev-ticket-all-soldout-sub">No more spots available for others.</div>
                    </div>
                )}
                {isTicketUsed ? (
                    <div className="ev-ticket-used-notice">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Ticket scanned — enjoy the event!
                    </div>
                ) : (
                    <button
                        className="ev-ticket-cancel-btn"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {loading ? 'Cancelling…' : 'Cancel booking'}
                    </button>
                )}
            </div>
        );
    }

    if (isPast && !isBooked) {
        return (
            <div className="ev-ticket-selector">
                <div className="ev-ticket-past">
                    <div className="ev-ticket-past-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                    </div>
                    <p className="ev-ticket-past-title">Event has ended</p>
                    <p className="ev-ticket-past-sub">Bookings are no longer available for this event.</p>
                </div>
            </div>
        );
    }

    if (tickets.length === 0) {
        return (
            <div className="ev-ticket-selector">
                <p className="ev-ticket-empty">No tickets available</p>
            </div>
        );
    }

    if (allSoldOut) {
        return (
            <div className="ev-ticket-selector">
                <div className="ev-ticket-all-soldout">
                    <div className="ev-ticket-all-soldout-icon">🎟</div>
                    <div className="ev-ticket-all-soldout-title">Sold Out</div>
                    <div className="ev-ticket-all-soldout-sub">All tickets for this event have been claimed.</div>
                </div>
                <div className="ev-ticket-tiers ev-ticket-tiers--faded">
                    {tickets.map(t => (
                        <div key={t.id} className="ev-ticket-tier ev-ticket-tier--soldout">
                            <div className="ev-ticket-tier-left">
                                <span className="ev-ticket-tier-radio" />
                                <div className="ev-ticket-tier-info">
                                    <span className="ev-ticket-tier-name">{t.name}</span>
                                    <span className="ev-ticket-tier-avail">No spots left</span>
                                </div>
                            </div>
                            <span className="ev-ticket-soldout-badge">Sold out</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="ev-ticket-selector">
            <p className="ev-ticket-selector-label">Tickets</p>

            <div className="ev-ticket-tiers">
                {tickets.map(t => {
                    const soldOut = t.availableSpots === 0;
                    const active  = t.id === selectedId;
                    return (
                        <button
                            key={t.id}
                            className={[
                                'ev-ticket-tier',
                                active    ? 'ev-ticket-tier--selected' : '',
                                soldOut   ? 'ev-ticket-tier--soldout'  : '',
                            ].join(' ')}
                            onClick={() => { if (!soldOut) { setSelectedId(t.id); setQty(1); } }}
                            disabled={soldOut}
                            type="button"
                        >
                            <div className="ev-ticket-tier-left">
                                <span className="ev-ticket-tier-radio">
                                    {active && !soldOut && <span className="ev-ticket-tier-radio-dot" />}
                                </span>
                                <div className="ev-ticket-tier-info">
                                    <span className="ev-ticket-tier-name">{t.name}</span>
                                    <span className="ev-ticket-tier-avail">
                                        {soldOut
                                            ? 'No spots left'
                                            : t.availableSpots == null
                                            ? 'Unlimited spots'
                                            : `${t.availableSpots} spot${t.availableSpots !== 1 ? 's' : ''} left`}
                                    </span>
                                </div>
                            </div>
                            {soldOut
                                ? <span className="ev-ticket-soldout-badge">Sold out</span>
                                : <span className="ev-ticket-tier-price">
                                    {t.price === 0 ? 'Free' : `${t.currency} ${t.price.toFixed(2)}`}
                                  </span>
                            }
                        </button>
                    );
                })}
            </div>

            {selected && (
                <>
                    {/*<div className="ev-ticket-qty-row">*/}
                    {/*    <span className="ev-ticket-qty-label">Quantity</span>*/}
                    {/*    <div className="ev-ticket-qty-ctrl">*/}
                    {/*        <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}>−</button>*/}
                    {/*        <span>{qty}</span>*/}
                    {/*        <button type="button" onClick={() => setQty(q => Math.min(maxQty, q + 1))} disabled={qty >= maxQty}>+</button>*/}
                    {/*    </div>*/}
                    {/*</div>*/}

                    {unitPrice > 0 && (
                        <div className="ev-ticket-price-summary">
                            <div className="ev-ticket-price-row">
                                <span>{qty} × {fmt(unitPrice)}</span>
                                <span>{fmt(subtotal)}</span>
                            </div>
                            <div className="ev-ticket-price-row ev-ticket-price-row--fee">
                                <span>Service fee (5%)</span>
                                <span>{fmt(fee)}</span>
                            </div>
                            <div className="ev-ticket-price-total">
                                <span>Total</span>
                                <span>{fmt(total)}</span>
                            </div>
                        </div>
                    )}
                </>
            )}

            <button
                className="ev-ticket-checkout-btn"
                disabled={!selected || (selected.availableSpots === 0) || loading}
                onClick={() => {
                    if (!isAuth) { onAuthRequired(); return; }
                    if (selected) onCheckout(selected.id, qty);
                }}
            >
                {unitPrice === 0 ? 'Reserve Free Ticket' : `Checkout — ${fmt(total)}`}
            </button>
        </div>
    );
}
