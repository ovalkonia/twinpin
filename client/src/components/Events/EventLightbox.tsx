import { useEffect } from 'react';
import { IconClose } from '../../assets/icons.tsx';

interface Props {
    photo: string;
    onClose: () => void;
}

function isVideo(url: string): boolean {
    return /\/video\/upload\//.test(url) || /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
}

export default function EventLightbox({ photo, onClose }: Props) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const video = isVideo(photo);

    return (
        <div className="event-lightbox" onClick={onClose}>
            <button
                className="event-lightbox-close"
                onClick={e => { e.stopPropagation(); onClose(); }}
                aria-label="Close"
            >
                <IconClose size={18} />
            </button>
            {video ? (
                <video
                    src={photo}
                    controls
                    autoPlay
                    className="event-lightbox-img"
                    onClick={e => e.stopPropagation()}
                />
            ) : (
                <img
                    src={photo}
                    alt="Event media"
                    className="event-lightbox-img"
                    onClick={e => e.stopPropagation()}
                />
            )}
        </div>
    );
}
