import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Header from '../../components/Header/header';
import { IconCheck, IconShield } from '../../assets/icons';
import { getEventById, getEventTickets, subscribeToEvent, type Event, type TicketTier } from '../../services/events';
import '../../styles/checkout.css';

// ─── Stripe setup ─────────────────────────────────────────────────────────────

const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const CARD_STYLE = {
    style: {
        base: {
            color: '#e0e0e0',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            '::placeholder': { color: '#555' },
        },
        invalid: { color: '#e74c3c' },
    },
};

// ─── Inner form (uses Stripe hooks) ──────────────────────────────────────────

interface FormProps {
    event: Event;
    tier: TicketTier;
    qty: number;
    onSuccess: (total: number) => void;
}

function CheckoutForm({ event, tier, qty, onSuccess }: FormProps) {
    const stripe   = useStripe();
    const elements = useElements();
    const [name, setName]         = useState('');
    const [cardFocus, setCardFocus] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [cardError, setCardError]   = useState<string | null>(null);

    const unitPrice = tier.price;
    const subtotal  = unitPrice * qty;
    const fee       = Math.round(subtotal * 0.05 * 100) / 100;
    const total     = subtotal + fee;
    const isFree    = unitPrice === 0;
    const currency  = tier.currency;
    const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setCardError(null);

        try {
            // Tokenise card with Stripe (no charge — backend uses simulation)
            if (!isFree && stripe && elements) {
                const cardEl = elements.getElement(CardElement);
                if (!cardEl) { setSubmitting(false); return; }
                const { error } = await stripe.createPaymentMethod({
                    type: 'card',
                    card: cardEl,
                    billing_details: { name: name.trim() || undefined },
                });
                if (error) {
                    setCardError(error.message ?? 'Card error');
                    setSubmitting(false);
                    return;
                }
            }

            await subscribeToEvent(event.id, qty, tier.id);
            onSuccess(total);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Booking failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* ── Payment card ── */}
            <div className="checkout-card">
                <h2 className="checkout-card-title">Payment</h2>

                {!isFree && (
                    <>
                        <div className="co-field">
                            <label className="co-label">Name on card</label>
                            <input
                                className="co-input"
                                placeholder="Jane Smith"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                autoComplete="cc-name"
                            />
                        </div>

                        <div className="co-field">
                            <label className="co-label">Card details</label>
                            <div className={`co-card-element${cardFocus ? ' co-card-element--focus' : ''}`}>
                                <CardElement
                                    options={CARD_STYLE}
                                    onFocus={() => setCardFocus(true)}
                                    onBlur={() => setCardFocus(false)}
                                    onChange={e => setCardError(e.error?.message ?? null)}
                                />
                            </div>
                        </div>

                        {cardError && (
                            <div className="co-error">{cardError}</div>
                        )}
                    </>
                )}

                {isFree && (
                    <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
                        This is a free event — no payment required.
                    </p>
                )}

                <button
                    type="submit"
                    className="co-pay-btn"
                    disabled={submitting || (!isFree && !stripe)}
                >
                    {submitting
                        ? <><span className="co-pay-btn-spinner" /> Processing…</>
                        : isFree
                        ? 'Reserve Free Ticket'
                        : `Pay ${fmt(total)}`}
                </button>

                <div className="co-secure">
                    <IconShield size={13} />
                    Secured by Stripe
                </div>
            </div>
        </form>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();
    const [searchParams] = useSearchParams();

    const ticketId = searchParams.get('ticketId') ?? undefined;
    const qty      = Math.max(1, parseInt(searchParams.get('qty') ?? '1', 10));

    const [event,   setEvent]   = useState<Event | null>(null);
    const [tickets, setTickets] = useState<TicketTier[]>([]);
    const [loading, setLoading] = useState(true);
    const [succeeded, setSucceeded] = useState(false);
    const [paidTotal, setPaidTotal] = useState(0);

    useEffect(() => {
        if (!eventId) return;
        setLoading(true);
        Promise.all([getEventById(eventId), getEventTickets(eventId)])
            .then(([ev, tiers]) => { setEvent(ev); setTickets(tiers); })
            .catch(() => toast.error('Failed to load event'))
            .finally(() => setLoading(false));
    }, [eventId]);

    const tier = useMemo<TicketTier | null>(() => {
        if (!tickets.length) return null;
        if (ticketId) return tickets.find(t => t.id === ticketId) ?? tickets[0];
        return tickets.find(t => t.isDefault) ?? tickets[0];
    }, [tickets, ticketId]);

    if (loading) {
        return (
            <div className="checkout-page">
                <Header />
                <div className="checkout-wrap"><p style={{ color: '#666' }}>Loading…</p></div>
            </div>
        );
    }

    if (!event || !tier) {
        return (
            <div className="checkout-page">
                <Header />
                <div className="checkout-wrap"><p>Event or ticket not found.</p></div>
            </div>
        );
    }

    if (succeeded) {
        const fmt = (n: number) => `${tier.currency} ${n.toFixed(2)}`;
        return (
            <div className="checkout-page">
                <Header />
                <div className="checkout-wrap">
                    <div className="co-success">
                        <div className="co-success-icon">
                            <IconCheck size={36} />
                        </div>
                        <h1 className="co-success-title">Booking Confirmed!</h1>
                        <p className="co-success-sub">
                            Your ticket for <strong>{event.title}</strong> is confirmed.<br />
                            Check your notifications for details.
                        </p>
                        <div className="co-success-detail">
                            <div className="co-success-detail-row">
                                <span>Event</span><span>{event.title}</span>
                            </div>
                            <div className="co-success-detail-row">
                                <span>Ticket</span><span>{tier.name}</span>
                            </div>
                            <div className="co-success-detail-row">
                                <span>Quantity</span><span>{qty}</span>
                            </div>
                            {paidTotal > 0 && (
                                <div className="co-success-detail-row">
                                    <span>Total paid</span><span>{fmt(paidTotal)}</span>
                                </div>
                            )}
                        </div>
                        <div className="co-success-actions">
                            <button className="co-success-btn-primary" onClick={() => navigate('/tickets')}>
                                My Tickets
                            </button>
                            <button className="co-success-btn-ghost" onClick={() => navigate(`/events/${event.id}`)}>
                                Back to Event
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const unitPrice = tier.price;
    const subtotal  = unitPrice * qty;
    const fee       = Math.round(subtotal * 0.05 * 100) / 100;
    const total     = subtotal + fee;
    const currency  = tier.currency;
    const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;

    return (
        <div className="checkout-page">
            <Header />
            <div className="checkout-wrap">
                <button className="checkout-back" onClick={() => navigate(`/events/${event.id}`)}>
                    ← Back to event
                </button>

                <h1 className="checkout-heading">
                    Complete Your <span>Booking</span>
                </h1>

                <div className="checkout-grid">
                    {/* Left: payment form */}
                    {stripePromise ? (
                        <Elements stripe={stripePromise}>
                            <CheckoutForm
                                event={event}
                                tier={tier}
                                qty={qty}
                                onSuccess={(t) => { setPaidTotal(t); setSucceeded(true); }}
                            />
                        </Elements>
                    ) : (
                        /* Stripe key not configured — fallback form */
                        <FallbackForm
                            event={event}
                            tier={tier}
                            qty={qty}
                            onSuccess={(t) => { setPaidTotal(t); setSucceeded(true); }}
                        />
                    )}

                    {/* Right: order summary */}
                    <div className="checkout-card">
                        <h2 className="checkout-card-title">Order Summary</h2>

                        {event.coverUrl && (
                            <img
                                src={event.coverUrl}
                                alt={event.title}
                                style={{ width: '100%', borderRadius: 10, marginBottom: 16, aspectRatio: '16/9', objectFit: 'cover' }}
                            />
                        )}

                        <div className="co-event-row">
                            <p className="co-event-name">{event.title}</p>
                            <div className="co-event-meta">
                                <span className="co-event-meta-row">
                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                {event.location && (
                                    <span className="co-event-meta-row">{event.location}</span>
                                )}
                            </div>
                        </div>

                        <div className="co-qty-row" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
                            <span className="co-qty-label">{tier.name}</span>
                            <span style={{ color: '#ccc', fontWeight: 600, fontSize: 14 }}>× {qty}</span>
                        </div>

                        <div className="co-price-divider" style={{ margin: '16px 0 12px' }} />

                        <div className="co-price-lines">
                            <div className="co-price-row">
                                <span>{qty} × {unitPrice === 0 ? 'Free' : fmt(unitPrice)}</span>
                                <span>{fmt(subtotal)}</span>
                            </div>
                            {unitPrice > 0 && (
                                <div className="co-price-row">
                                    <span>Service fee (5%)</span>
                                    <span>{fmt(fee)}</span>
                                </div>
                            )}
                        </div>

                        <div className="co-price-total">
                            <span>Total</span>
                            <span>{unitPrice === 0 ? 'Free' : fmt(total)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Fallback form (no Stripe key) ────────────────────────────────────────────

function FallbackForm({ event, tier, qty, onSuccess }: FormProps) {
    const [submitting, setSubmitting] = useState(false);
    const unitPrice = tier.price;
    const subtotal  = unitPrice * qty;
    const fee       = Math.round(subtotal * 0.05 * 100) / 100;
    const total     = subtotal + fee;
    const isFree    = unitPrice === 0;
    const currency  = tier.currency;
    const fmt = (n: number) => `${currency} ${n.toFixed(2)}`;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await subscribeToEvent(event.id, qty, tier.id);
            onSuccess(total);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Booking failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="checkout-card">
                <h2 className="checkout-card-title">Payment</h2>
                {isFree ? (
                    <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>Free event — no payment needed.</p>
                ) : (
                    <>
                        <div className="co-field">
                            <label className="co-label">Name on card</label>
                            <input className="co-input" placeholder="Jane Smith" autoComplete="cc-name" />
                        </div>
                        <div className="co-field">
                            <label className="co-label">Card number</label>
                            <input className="co-input" placeholder="4242 4242 4242 4242" maxLength={19} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="co-field">
                                <label className="co-label">Expiry</label>
                                <input className="co-input" placeholder="MM / YY" maxLength={7} />
                            </div>
                            <div className="co-field">
                                <label className="co-label">CVC</label>
                                <input className="co-input" placeholder="CVC" maxLength={4} />
                            </div>
                        </div>
                    </>
                )}
                <button type="submit" className="co-pay-btn" disabled={submitting}>
                    {submitting
                        ? <><span className="co-pay-btn-spinner" /> Processing…</>
                        : isFree ? 'Reserve Free Ticket' : `Pay ${fmt(total)}`}
                </button>
                <div className="co-secure"><IconShield size={13} /> Secured by Stripe</div>
            </div>
        </form>
    );
}
