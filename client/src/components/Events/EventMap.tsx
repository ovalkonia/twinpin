import { IconMapPin } from '../../assets/icons.tsx';

interface Props {
    location: { name: string; address: string; lat?: number; lng?: number };
}

export default function EventMap({ location }: Props) {
    const mapSrc = location.lat && location.lng
        ? `https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`
        : null;

    return (
        <div className="event-map-wrap">
            <h3 className="event-section-title">Location</h3>
            {mapSrc ? (
                <iframe
                    className="event-map"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={mapSrc}
                    title="Event location map"
                />
            ) : (
                <div className="event-map-skeleton" />
            )}
            <p className="event-map-address">
                <IconMapPin size={13} />
                {location.name} — {location.address}
            </p>
        </div>
    );
}