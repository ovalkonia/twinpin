interface Props {
    coverPhoto: string | null;
    name: string;
}

export default function EventCover({ coverPhoto, name }: Props) {
    return (
        <section className="event-cover">
            {coverPhoto ? (
                <>
                    <img src={coverPhoto} alt={name} className="event-cover-img" />
                    <div className="event-cover-overlay" />
                </>
            ) : (
                <div className="event-cover-gradient" />
            )}
        </section>
    );
}