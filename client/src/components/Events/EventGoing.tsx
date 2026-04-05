import { Link } from 'react-router-dom';

const VISIBLE_MAX = 12;

interface Attendee {
    id: string;
    name: string;
    avatarUrl?: string;
}

interface Props {
    attendees: Attendee[];
}

export default function EventGoing({ attendees }: Props) {
    if (attendees.length === 0) return null;

    const visible      = attendees.slice(0, VISIBLE_MAX);
    const overflowCount = attendees.length - VISIBLE_MAX;

    return (
        <div className="event-going">
            <h3 className="event-section-title">Going ({attendees.length})</h3>
            <div className="event-going-grid">
                {visible.map(a => (
                    <Link
                        key={a.id}
                        to={`/profile/${a.id}`}
                        className="event-attendee-avatar"
                        title={a.name}
                    >
                        {a.avatarUrl ? (
                            <img
                                src={a.avatarUrl}
                                alt={a.name}
                                className="event-attendee-img"
                            />
                        ) : (
                            a.name[0]?.toUpperCase() ?? '?'
                        )}
                    </Link>
                ))}
                {overflowCount > 0 && (
                    <div className="event-attendee-overflow">+{overflowCount}</div>
                )}
            </div>
        </div>
    );
}
