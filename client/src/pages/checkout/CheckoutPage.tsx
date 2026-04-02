import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import { getEventById, subscribeToEvent, type Event } from '../../services/events';
import '../../styles/checkout.css';

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { eventId } = useParams<{ eventId: string }>();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [succeeded, setSucceeded] = useState(false);

    useEffect(() => {
        if (!eventId) return;
        setLoading(true);
        getEventById(eventId)
            .then(setEvent)
            .catch(() => {
                toast.error('Failed to load event');
            })
            .finally(() => setLoading(false));
    }, [eventId]);

    const maxSpots = useMemo(() => {
        if (!event) return 1;
        const cap = event.capacity ?? 0;
        const left = cap - event.attendeeCount;
        return Math.max(1, left);
    }, [event]);

    useEffect(() => {
        setQuantity((q) => Math.min(Math.max(1, q), maxSpots));
    }, [maxSpots]);

    const unitPrice = event ? event.price : 0;
    const subtotal = unitPrice * quantity;
    const total = subtotal + Math.round(subtotal * 0.05 * 100) / 100;

    const handleSubmit = async () => {
        if (!event) return;
        setSubmitting(true);
        try {
            await subscribeToEvent(event.id, quantity);
            setSucceeded(true);
        } catch (e: any) {
            const msg = e?.response?.data?.message;
            toast.error(typeof msg === 'string' ? msg : 'Failed to complete booking');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="checkout-page">
                <Header />
                <div className="checkout-wrap">
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="checkout-page">
                <Header />
                <div className="checkout-wrap">
                    <p>Event not found</p>
                </div>
            </div>
        );
    }

    if (succeeded) {
        return (
            <div className="checkout-page">
                <Header />
                <div className="checkout-wrap">
                    <h1 className="checkout-heading">
                        Booking <span>confirmed</span>
                    </h1>
                    <p>
                        Your booking for <strong>{event.title}</strong> is confirmed.
                    </p>
                    <p>
                        Tickets: <strong>{quantity}</strong>, Total paid: <strong>${total.toFixed(2)}</strong>
                    </p>
                    <button className="co-success-btn-primary" onClick={() => navigate('/tickets')}>
                        My Tickets
                    </button>
                    <button className="co-success-btn-ghost" onClick={() => navigate(`/events/${event.id}`)}>
                        Back to Event
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <Header />
            <div className="checkout-wrap">
                <button className="checkout-back" onClick={() => navigate(`/events/${event.id}`)}>
                    Back to event
                </button>

                <h1 className="checkout-heading">
                    Complete Your <span>Booking</span>
                </h1>

                <div className="checkout-grid">
                    <div className="checkout-card">
                        <h2 className="checkout-card-title">Booking details</h2>

                        <div className="co-field">
                            <label className="co-label">Event</label>
                            <div className="co-readonly">{event.title}</div>
                        </div>

                        <div className="co-field">
                            <label className="co-label">When</label>
                            <div className="co-readonly">{new Date(event.date).toLocaleString()}</div>
                        </div>

                        <div className="co-field">
                            <label className="co-label">Where</label>
                            <div className="co-readonly">{event.location ?? 'TBD'}</div>
                        </div>

                        <div className="co-qty-row">
                            <span className="co-qty-label">Tickets</span>
                            <div className="co-qty-control">
                                <button
                                    type="button"
                                    className="co-qty-btn"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    disabled={quantity <= 1}
                                >
                                    −
                                </button>
                                <span className="co-qty-value">{quantity}</span>
                                <button
                                    type="button"
                                    className="co-qty-btn"
                                    onClick={() => setQuantity((q) => Math.min(maxSpots, q + 1))}
                                    disabled={quantity >= maxSpots}
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <div className="co-price-divider" />

                        <div className="co-price-lines">
                            <div className="co-price-row">
                                <span>
                                    {quantity} × {event.price === 0 ? 'Free' : `$${event.price}`}
                                </span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="co-price-row">
                                <span>Service fee (5%)</span>
                                <span>${(total - subtotal).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="co-price-total">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>

                        <button className="co-pay-btn" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Booking...' : 'Confirm booking'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

