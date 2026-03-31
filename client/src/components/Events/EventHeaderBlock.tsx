import { IconCalendar, IconClock } from '../../assets/icons.tsx';

interface Props {
    name: string;
    category: string;
    status: 'upcoming' | 'ongoing' | 'past';
    date: string;
    time: string;
}

const STATUS_LABEL: Record<Props['status'], string> = {
    upcoming: 'Upcoming',
    ongoing:  'Live Now',
    past:     'Past',
};

export default function EventHeaderBlock({ name, category, status, date, time }: Props) {
    return (
        <div className="event-header-block">
            <div className="event-header-badges">
                <span className="event-badge event-badge--category">{category}</span>
                <span className={`event-badge event-badge--status event-badge--${status}`}>
                    {STATUS_LABEL[status]}
                </span>
            </div>
            <h1 className="event-name">{name}</h1>
            <div className="event-header-meta">
                <span className="event-meta-item">
                    <IconCalendar size={14} />{date}
                </span>
                <span className="event-meta-item">
                    <IconClock size={14} />{time}
                </span>
            </div>
        </div>
    );
}