import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/header';
import { useAuth } from '../../context/AuthContext';
import EventCover from '../../components/Events/EventCover.tsx';
import EventPhotoSpiral from '../../components/Events/EventPhotoSpiral.tsx';
import EventHeaderBlock from '../../components/Events/EventHeaderBlock.tsx';
import EventMap from '../../components/Events/EventMap.tsx';
import EventFaq from '../../components/Events/EventFaq.tsx';
import EventGoing from '../../components/Events/EventGoing.tsx';
import EventInfoCard from '../../components/Events/EventInfoCard.tsx';
import EventBookButton from '../../components/Events/EventBookButton.tsx';
import EventShare from '../../components/Events/EventShare.tsx';
import EventLightbox from '../../components/Events/EventLightbox.tsx';
import '../../styles/event-page.css';

interface EventData {
    id: string;
    name: string;
    coverPhoto: string | null;
    photos: string[];
    date: string;
    time: string;
    location: { name: string; address: string; lat?: number; lng?: number };
    organizer: string;
    price: number | 'free';
    category: string;
    status: 'upcoming' | 'ongoing' | 'past';
    capacity: number;
    spotsLeft: number;
    faq: { question: string; answer: string }[];
    attendees: { name: string; id: string }[];
}

const MOCK_EVENT: EventData = {
    id: 'evt-001',
    name: 'Dev Conference 2026',
    coverPhoto: 'https://picsum.photos/seed/event1/1200/400',
    photos: [
        'https://picsum.photos/seed/p1/600/400',
        'https://picsum.photos/seed/p2/600/400',
        'https://picsum.photos/seed/p3/600/400',
    ],
    date: 'Saturday, May 3, 2026',
    time: '9:00 AM – 6:00 PM',
    location: {
        name: 'Moscone Center',
        address: '747 Howard St, San Francisco, CA 94103',
        lat: 37.7845,
        lng: -122.4008,
    },
    organizer: 'TechEvents Inc.',
    price: 120,
    category: 'Tech',
    status: 'upcoming',
    capacity: 500,
    spotsLeft: 73,
    faq: [
        {
            question: 'Is parking available?',
            answer: 'Yes, paid parking is available in the Moscone Center garage on Howard St. Public transit via BART (Powell St.) is recommended.',
        },
        {
            question: 'Are pets allowed?',
            answer: 'Only certified service animals are permitted inside the venue.',
        },
        {
            question: 'What is the refund policy?',
            answer: 'Full refunds are available up to 7 days before the event. No refunds after that date.',
        },
        {
            question: 'Is food provided?',
            answer: 'Lunch and coffee breaks are included in the ticket price. Dietary requirements can be noted during checkout.',
        },
        {
            question: 'Is the event wheelchair accessible?',
            answer: 'Yes, the Moscone Center is fully accessible. Contact us in advance if you need reserved accessible seating.',
        },
        {
            question: 'Will talks be recorded?',
            answer: 'All keynote sessions will be recorded and shared with ticket holders within 2 weeks of the event.',
        },
    ],
    attendees: [
        { id: 'a1',  name: 'Alice Martin' },
        { id: 'a2',  name: 'Bob Chen' },
        { id: 'a3',  name: 'Carla Diaz' },
        { id: 'a4',  name: 'David Kim' },
        { id: 'a5',  name: 'Elsa Nguyen' },
        { id: 'a6',  name: 'Frank Lopez' },
        { id: 'a7',  name: 'Grace Wu' },
        { id: 'a8',  name: 'Hiro Tanaka' },
        { id: 'a9',  name: 'Iris Patel' },
        { id: 'a10', name: 'James Scott' },
        { id: 'a11', name: 'Kira Brown' },
        { id: 'a12', name: 'Leo Ferreira' },
        { id: 'a13', name: 'Mia Hassan' },
        { id: 'a14', name: 'Noah Carter' },
    ],
};

export default function EventPage() {
    const navigate = useNavigate();
    const { isAuth } = useAuth();

    const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

    const event = MOCK_EVENT;

    const handleBook = () => {
        if (!isAuth) { navigate('/auth/sign-in'); return; }
        navigate(`/checkout/${event.id}`);
    };

    return (
        <div className="event-page">
            <Header />

            <EventCover coverPhoto={event.coverPhoto} name={event.name} />

            <EventPhotoSpiral photos={event.photos} onPhotoClick={setLightboxPhoto} />

            <div className="event-layout">
                <main className="event-main">
                    <EventHeaderBlock
                        name={event.name}
                        category={event.category}
                        status={event.status}
                        date={event.date}
                        time={event.time}
                    />
                    <EventMap location={event.location} />
                    <EventFaq faq={event.faq} />
                    <EventGoing attendees={event.attendees} />
                </main>

                <aside className="event-sidebar">
                    <EventInfoCard
                        date={event.date}
                        time={event.time}
                        location={event.location}
                        organizer={event.organizer}
                        price={event.price}
                        capacity={event.capacity}
                        spotsLeft={event.spotsLeft}
                    />
                    <EventBookButton
                        isBooked={false}
                        price={event.price}
                        onClick={handleBook}
                    />
                    <EventShare eventName={event.name} />
                </aside>
            </div>

            {lightboxPhoto && (
                <EventLightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
            )}
        </div>
    );
}