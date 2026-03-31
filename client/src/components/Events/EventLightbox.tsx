import { useEffect } from 'react';
import { IconClose } from '../../assets/icons.tsx';

interface Props {
    photo: string;
    onClose: () => void;
}

export default function EventLightbox({ photo, onClose }: Props) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div className="event-lightbox" onClick={onClose}>
            <button
                className="event-lightbox-close"
                onClick={e => { e.stopPropagation(); onClose(); }}
                aria-label="Close"
            >
                <IconClose size={18} />
            </button>
            <img
                src={photo}
                alt="Event photo"
                className="event-lightbox-img"
                onClick={e => e.stopPropagation()}
            />
        </div>
    );
}