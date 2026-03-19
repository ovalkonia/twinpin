const VISIBLE_MAX = 12;

interface Props {
    attendees: { id: string; name: string }[];
}

export default function EventGoing({ attendees }: Props) {
    const visible      = attendees.slice(0, VISIBLE_MAX);
    const overflowCount = attendees.length - VISIBLE_MAX;

    return (
        <div className="event-going">
            <h3 className="event-section-title">Going ({attendees.length})</h3>
            <div className="event-going-grid">
                {visible.map(a => (
                    <div key={a.id} className="event-attendee-avatar" title={a.name}>
                        {a.name[0].toUpperCase()}
                    </div>
                ))}
                {overflowCount > 0 && (
                    <div className="event-attendee-overflow">+{overflowCount}</div>
                )}
            </div>
        </div>
    );
}