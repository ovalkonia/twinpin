import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSimilarEvents, getEvents, type Event } from '../../services/events';

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #1a1a2e, #0a0a1a)';

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
                    setEvents(similar);
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
    }, [events]);

    const scroll = (dir: 'prev' | 'next') => {
        const el = trackRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === 'next' ? el.clientWidth / 3 : -(el.clientWidth / 3), behavior: 'smooth' });
        setTimeout(updateArrows, 320);
    };

    if (!events.length) return null;

    return (
        <section className="ev-similar">
            <div className="ev-similar-header">
                <h3 className="ev-similar-title">{title}</h3>
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

            <div className="ev-similar-track" ref={trackRef} onScroll={updateArrows}>
                {events.map(ev => (
                    <Link key={ev.id} to={`/events/${ev.id}`} className="ev-similar-card">
                        <div
                            className="ev-similar-thumb"
                            style={ev.coverUrl
                                ? { backgroundImage: `url(${ev.coverUrl})` }
                                : { background: DEFAULT_GRADIENT }}
                        >
                            <span className="ev-similar-category">{ev.category}</span>
                        </div>
                        <div className="ev-similar-body">
                            <p className="ev-similar-name">{ev.title}</p>
                            <p className="ev-similar-date">
                                {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}