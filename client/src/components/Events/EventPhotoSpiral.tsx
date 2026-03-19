import { IconCamera } from '../../assets/icons.tsx';

interface Props {
    photos: string[];
    onPhotoClick: (src: string) => void;
}

export default function EventPhotoSpiral({ photos, onPhotoClick }: Props) {
    if (photos.length === 0) return null;

    return (
        <section className="event-spiral-wrap">
            <div className="event-spiral-label">
                <IconCamera size={13} />
                {photos.length} Photos
            </div>
            <div className="event-spiral">
                {photos.map((src, i) => (
                    <button
                        key={i}
                        className="event-spiral-item"
                        onClick={() => onPhotoClick(src)}
                        aria-label={`View photo ${i + 1}`}
                    >
                        <img src={src} alt={`Event photo ${i + 1}`} />
                    </button>
                ))}
            </div>
        </section>
    );
}