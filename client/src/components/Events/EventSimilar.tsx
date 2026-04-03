import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSimilarEvents, getEvents, type Event } from '../../services/events';

export default function EventSimilar({ eventId }: { eventId: string }) {
    const [events, setEvents] = useState<Event[]>([]);
    const [title, setTitle] = useState('Similar Events');

    useEffect(() => {
        getSimilarEvents(eventId, 4)
            .then(similar => {
                if (similar.length > 0) {
                    setEvents(similar);
                    setTitle('Similar Events');
                } else {
                    // Fall back to recent events, excluding the current one
                    return getEvents({ limit: 5 }).then(res => {
                        const others = res.data.filter(e => e.id !== eventId).slice(0, 4);
                        setEvents(others);
                        setTitle('You Might Also Like');
                    });
                }
            })
            .catch(() => {});
    }, [eventId]);

    if (!events.length) return null;

    return (
        <section className="ev-similar">
            <h3 className="ev-similar-title">{title}</h3>
            <div className="ev-similar-grid">
                {events.map(ev => (
                    <Link key={ev.id} to={`/events/${ev.id}`} className="ev-similar-card">
                        <div
                            className="ev-similar-thumb"
                            style={ev.coverUrl ? { backgroundImage: `url(${ev.coverUrl})` } : undefined}
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
