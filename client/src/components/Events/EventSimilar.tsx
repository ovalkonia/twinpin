import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSimilarEvents, getEvents, type Event } from '../../services/events';
import { IconCalendar, IconMapPin } from '../../assets/icons';

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #1a1a2e, #0a0a1a)';
const GAP = 14;
const PAGE_SIZE = 3;

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
    const [startIndex, setStartIndex] = useState(0);
    const [cardWidth, setCardWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setStartIndex(0);
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

    // Measure container to get exact integer card width
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => {
            const w = Math.floor((el.clientWidth - 2 * GAP) / 3);
            if (w > 0) setCardWidth(w);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [events]);

    // Slide track to current index position
    useEffect(() => {
        const el = trackRef.current;
        if (!el || cardWidth === 0) return;
        el.style.transform = `translateX(-${startIndex * (cardWidth + GAP)}px)`;
    }, [startIndex, cardWidth]);

    if (!events.length) return null;

    const canPrev = startIndex > 0;
    const canNext = startIndex + PAGE_SIZE < events.length;

    return (
        <section className="ev-similar">
            <div className="ev-similar-header">
                <h3 className="event-section-title" style={{ margin: 0 }}>{title}</h3>
                {events.length > PAGE_SIZE && (
                    <div className="ev-similar-arrows">
                        <button
                            className="ev-similar-arrow"
                            onClick={() => setStartIndex(i => i - 1)}
                            disabled={!canPrev}
                            aria-label="Previous"
                        >&#8249;</button>
                        <button
                            className="ev-similar-arrow"
                            onClick={() => setStartIndex(i => i + 1)}
                            disabled={!canNext}
                            aria-label="Next"
                        >&#8250;</button>
                    </div>
                )}
            </div>

            {/* overflow:hidden clip — the track slides behind this */}
            <div className="ev-similar-container" ref={containerRef}>
                <div
                    className="ev-similar-grid"
                    ref={trackRef}
                    style={{ '--card-w': cardWidth > 0 ? `${cardWidth}px` : undefined } as React.CSSProperties}
                >
                    {events.map(ev => {
                        const soldOut = ev.capacity != null && ev.attendeeCount >= ev.capacity;
                        return (
                            <div key={ev.id} className="event-card ev-similar-card" style={{ position: 'relative' }}>
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
            </div>
        </section>
    );
}
