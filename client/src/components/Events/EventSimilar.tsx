import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSimilarEvents, getEvents, type Event } from '../../services/events';
import { IconCalendar, IconMapPin } from '../../assets/icons';

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #1a1a2e, #0a0a1a)';
const CARD_WIDTH = 240;
const GAP = 14;

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function priceLabel(price: number, currency: string): string {
    if (price === 0) return 'Free';
    return `${currency} ${price.toFixed(2)}`;
}

export default function EventSimilar({ eventId }: { eventId: string }) {
    const [events, setEvents] = useState<Event[]>([]);
    const [title, setTitle] = useState('Similar Events');
    const trackRef = useRef<HTMLDivElement>(null);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);

    useEffect(() => {
        getSimilarEvents(eventId, 8)
            .then(similar => {
                if (similar.length > 0) {
                    setEvents(similar.slice(0, 8));
                    setTitle('Similar Events');
                } else {
                    return getEvents({ limit: 9 }).then(res => {
                        const others = res.data.filter(e => e.id !== eventId).slice(0, 8);
                        setEvents(others);
                        setTitle('You Might Also Like');
                    });
                }
            })
            .catch(() => {});
    }, [eventId]);

    const updateArrows = () => {
        const el = trackRef.current;
        if (!el) return;
        setCanPrev(el.scrollLeft > 0);
        setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };

    useEffect(() => {
        updateArrows();
        const el = trackRef.current;
        if (!el) return;
        const ro = new ResizeObserver(updateArrows);
        ro.observe(el);
        return () => ro.disconnect();
    }, [events]);

    const scroll = (dir: 'prev' | 'next') => {
        const el = trackRef.current;
        if (!el) return;
        const card = el.querySelector('.event-card') as HTMLElement | null;
        const step = card ? card.offsetWidth + GAP : CARD_WIDTH + GAP;
        el.scrollBy({ left: dir === 'next' ? step : -step, behavior: 'smooth' });
        setTimeout(updateArrows, 350);
    };

    if (!events.length) return null;

    return (
        <section className="ev-similar">
            <div className="ev-similar-header">
                <h3 className="event-section-title" style={{ margin: 0 }}>{title}</h3>
                <div className="ev-similar-arrows">
                    <button
                        className="ev-similar-arrow"
                        onClick={() => scroll('prev')}
                        disabled={!canPrev}
                        aria-label="Previous"
                    >&#8249;</button>
                    <button
                        className="ev-similar-arrow"
                        onClick={() => scroll('next')}
                        disabled={!canNext}
                        aria-label="Next"
                    >&#8250;</button>
                </div>
            </div>

            <div className="ev-similar-grid" ref={trackRef} onScroll={updateArrows}>
                {events.map(ev => {
                    const soldOut = ev.capacity != null && ev.attendeeCount >= ev.capacity;
                    return (
                        <div key={ev.id} className="event-card" style={{ position: 'relative' }}>
                            <Link
                                to={`/events/${ev.id}`}
                                style={{ position: 'absolute', inset: 0, zIndex: 1, borderRadius: 'inherit' }}
                                aria-label={ev.title}
                            />
                            <div
                                className="event-card-image"
                                style={ev.coverUrl
                                    ? { backgroundImage: `url(${ev.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                                    : { background: DEFAULT_GRADIENT }}
                            >
                                <span className="event-card-category">{ev.category}</span>
                                {soldOut && <span className="event-card-soldout">Sold Out</span>}
                            </div>
                            <div className="event-card-body">
                                <div className="event-card-title">{ev.title}</div>
                                <div className="event-card-meta">
                                    <span className="event-card-meta-row">
                                        <IconCalendar size={12} />
                                        {formatDate(ev.date)}
                                    </span>
                                    {ev.location && (
                                        <span className="event-card-meta-row">
                                            <IconMapPin size={12} />
                                            {ev.location}
                                        </span>
                                    )}
                                </div>
                                <div className="event-card-footer">
                                    <span className="event-card-price">
                                        {soldOut ? '' : priceLabel(ev.price, ev.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
