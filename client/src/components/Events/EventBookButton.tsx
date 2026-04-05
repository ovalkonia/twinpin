import { IconTicket, IconCheck } from '../../assets/icons.tsx';

interface Props {
    isBooked: boolean;
    price: number | 'free';
    onClick: () => void;
}

export default function EventBookButton({ isBooked, price, onClick }: Props) {
    const priceLabel = price === 'free' ? 'Free' : `$${price}`;

    return (
        <button
            className={`event-book-btn${isBooked ? ' event-book-btn--booked' : ''}`}
            onClick={onClick}
        >
            {isBooked ? (
                <><IconCheck size={16} /> You're Going!</>
            ) : (
                <><IconTicket size={16} /> Book Ticket — {priceLabel}</>
            )}
        </button>
    );
}