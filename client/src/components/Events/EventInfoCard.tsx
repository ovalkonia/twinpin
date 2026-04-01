import { IconCalendar, IconClock, IconMapPin, IconUser, IconTicket, IconUsers } from '../../assets/icons.tsx';

interface Props {
    date: string;
    time: string;
    location: { name: string; address: string };
    organizer: string;
    price: number | 'free';
    capacity: number;
    spotsLeft: number;
}

export default function EventInfoCard({ date, time, location, organizer, price, capacity, spotsLeft }: Props) {
    const bookedPercent = ((capacity - spotsLeft) / capacity) * 100;
    const priceLabel    = price === 'free' ? 'Free' : `$${price}`;

    return (
        <div className="event-info-card">
            <p className="event-info-card-title">Event Details</p>
            <ul className="event-info-list">
                <li className="event-info-item">
                    <IconCalendar size={15} />
                    <div className="event-info-item-text">
                        <span className="event-info-label">Date</span>
                        <span className="event-info-value">{date}</span>
                    </div>
                </li>
                <li className="event-info-item">
                    <IconClock size={15} />
                    <div className="event-info-item-text">
                        <span className="event-info-label">Time</span>
                        <span className="event-info-value">{time}</span>
                    </div>
                </li>
                <li className="event-info-item">
                    <IconMapPin size={15} />
                    <div className="event-info-item-text">
                        <span className="event-info-label">Location</span>
                        <span className="event-info-value">{location.name}</span>
                        <span className="event-info-address">{location.address}</span>
                    </div>
                </li>
                <li className="event-info-item">
                    <IconUser size={15} />
                    <div className="event-info-item-text">
                        <span className="event-info-label">Organizer</span>
                        <span className="event-info-value">{organizer}</span>
                    </div>
                </li>
                <li className="event-info-item">
                    <IconTicket size={15} />
                    <div className="event-info-item-text">
                        <span className="event-info-label">Price</span>
                        <span className="event-info-value event-info-value--price">{priceLabel}</span>
                    </div>
                </li>
                <li className="event-info-item">
                    <IconUsers size={15} />
                    <div className="event-info-item-text">
                        <span className="event-info-label">Availability</span>
                        <span className="event-info-value">{spotsLeft} spots left of {capacity}</span>
                        <div className="event-capacity-bar">
                            <div className="event-capacity-fill" style={{ width: `${bookedPercent}%` }} />
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    );
}