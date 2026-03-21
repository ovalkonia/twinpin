import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import Header from '../../components/Header/header';
import { createPaymentIntent } from '../../services/payment';
import '../../styles/checkout.css';

// Initialise Stripe once outside the component tree
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? '');

const SERVICE_FEE_RATE = 0.05;

// Mirrors the EventData shape from EventPage — replace with an API fetch when ready
interface EventSummary {
    id: string;
    name: string;
    date: string;
    time: string;
    location: string;
    organizer: string;
    price: number | 'free';
    spotsLeft: number;
}

// Temporary mock — keyed by eventId
const MOCK_EVENTS: Record<string, EventSummary> = {
    'evt-001': {
        id:        'evt-001',
        name:      'Dev Conference 2026',
        date:      'Saturday, May 3, 2026',
        time:      '9:00 AM – 6:00 PM',
        location:  'Moscone Center, San Francisco',
        organizer: 'TechEvents Inc.',
        price:     120,
        spotsLeft: 73,
    },
};

const CARD_STYLE = {
    style: {
        base: {
            color: '#e0e0e0',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            '::placeholder': { color: '#444' },
        },
        invalid: { color: '#e74c3c' },
    },
};

/* ── Success screen ──────────────────────────────────────────── */
interface SuccessProps {
    event: EventSummary;
    quantity: number;
    total: number;
    onViewTickets: () => void;
    onBackToEvent: () => void;
}

const SuccessView = ({ event, quantity, total, onViewTickets, onBackToEvent }: SuccessProps) => (
    <div className="co-success">
        <div className="co-success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
            </svg>
        </div>

        <h2 className="co-success-title">You're all set!</h2>
        <p className="co-success-sub">
            Your booking is confirmed. Check your tickets below<br />or return to the event page.
        </p>

        <div className="co-success-detail">
            <div className="co-success-detail-row">
                <span>Event</span><span>{event.name}</span>
            </div>
            <div className="co-success-detail-row">
                <span>Date</span><span>{event.date}</span>
            </div>
            <div className="co-success-detail-row">
                <span>Tickets</span><span>{quantity}</span>
            </div>
            <div className="co-success-detail-row">
                <span>Total paid</span>
                <span style={{ color: '#ff6b00' }}>
                    ${total.toFixed(2)}
                </span>
            </div>
        </div>

        <div className="co-success-actions">
            <button className="co-success-btn-primary" onClick={onViewTickets}>
                My Tickets
            </button>
            <button className="co-success-btn-ghost" onClick={onBackToEvent}>
                Back to Event
            </button>
        </div>
    </div>
);

/* ── Checkout form (needs Stripe context) ────────────────────── */
const CheckoutContent = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate    = useNavigate();
    const stripe      = useStripe();
    const elements    = useElements();

    const event = MOCK_EVENTS[eventId ?? ''] ?? MOCK_EVENTS['evt-001'];

    const [quantity,       setQuantity]       = useState(1);
    const [cardholderName, setCardholderName] = useState('');
    const [cardFocused,    setCardFocused]    = useState(false);
    const [loading,        setLoading]        = useState(false);
    const [error,          setError]          = useState<string | null>(null);
    const [succeeded,      setSucceeded]      = useState(false);

    const unitPrice  = event.price === 'free' ? 0 : event.price;
    const subtotal   = unitPrice * quantity;
    const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
    const total      = subtotal + serviceFee;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        setLoading(true);
        setError(null);

        try {
            const { data } = await createPaymentIntent(event.id, quantity);

            const result = await stripe.confirmCardPayment(data.clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: { name: cardholderName },
                },
            });

            if (result.error) {
                setError(result.error.message ?? 'Payment failed. Please try again.');
            } else if (result.paymentIntent?.status === 'succeeded') {
                setSucceeded(true);
            }
        } catch {
            setError('Could not connect to payment service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (succeeded) {
        return (
            <SuccessView
                event={event}
                quantity={quantity}
                total={total}
                onViewTickets={() => navigate('/tickets')}
                onBackToEvent={() => navigate(`/events/${event.id}`)}
            />
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="checkout-grid">

                {/* ── Left: payment form ──────────────────────── */}
                <div className="checkout-card">
                    <h2 className="checkout-card-title">Payment Details</h2>

                    <div className="co-field">
                        <label className="co-label">Cardholder name</label>
                        <input
                            className="co-input"
                            type="text"
                            placeholder="Name on card"
                            value={cardholderName}
                            onChange={e => setCardholderName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="co-field">
                        <label className="co-label">Card information</label>
                        <div className={`co-card-element${cardFocused ? ' co-card-element--focus' : ''}`}>
                            <CardElement
                                options={CARD_STYLE}
                                onFocus={() => setCardFocused(true)}
                                onBlur={() => setCardFocused(false)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="co-error">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            {error}
                        </div>
                    )}

                    <button className="co-pay-btn" type="submit" disabled={loading || !stripe}>
                        {loading ? (
                            <span className="co-pay-btn-spinner" />
                        ) : (
                            <>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                                </svg>
                                Pay ${total.toFixed(2)}
                            </>
                        )}
                    </button>

                    <p className="co-secure">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        Secured by Stripe · 256-bit SSL encryption
                    </p>
                </div>

                {/* ── Right: order summary ─────────────────────── */}
                <div className="checkout-card">
                    <h2 className="checkout-card-title">Order Summary</h2>

                    {/* Event info */}
                    <div className="co-event-row">
                        <p className="co-event-name">{event.name}</p>
                        <div className="co-event-meta">
                            <span className="co-event-meta-row">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                                {event.date} · {event.time}
                            </span>
                            <span className="co-event-meta-row">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                                </svg>
                                {event.location}
                            </span>
                            <span className="co-event-meta-row">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                </svg>
                                {event.organizer}
                            </span>
                        </div>
                    </div>

                    {/* Quantity */}
                    <div className="co-qty-row">
                        <span className="co-qty-label">Tickets</span>
                        <div className="co-qty-control">
                            <button
                                type="button"
                                className="co-qty-btn"
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                disabled={quantity <= 1}
                            >
                                −
                            </button>
                            <span className="co-qty-value">{quantity}</span>
                            <button
                                type="button"
                                className="co-qty-btn"
                                onClick={() => setQuantity(q => Math.min(event.spotsLeft, q + 1))}
                                disabled={quantity >= event.spotsLeft}
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Price breakdown */}
                    <div className="co-price-lines">
                        <div className="co-price-row">
                            <span>
                                {quantity} × {event.price === 'free' ? 'Free' : `$${event.price}`}
                            </span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="co-price-row">
                            <span>Service fee (5%)</span>
                            <span>${serviceFee.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="co-price-divider" />
                    <div className="co-price-total">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>

            </div>
        </form>
    );
};

/* ── Page root (provides Stripe context) ─────────────────────── */
export const CheckoutPage = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();

    return (
        <div className="checkout-page">
            <Header />
            <div className="checkout-wrap">
                <button className="checkout-back" onClick={() => navigate(`/events/${eventId}`)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Back to event
                </button>

                <h1 className="checkout-heading">Complete Your <span>Booking</span></h1>

                <Elements stripe={stripePromise}>
                    <CheckoutContent />
                </Elements>
            </div>
        </div>
    );
};