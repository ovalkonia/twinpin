import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { IconShare } from '../../assets/icons.tsx';

interface Props {
    eventName: string;
}

export default function EventShare({ eventName }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied!');
        setOpen(false);
    };

    const handleOpen = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
        setOpen(false);
    };

    const href = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(eventName);

    return (
        <div className="event-share" ref={ref}>
            <button className="event-share-btn" onClick={() => setOpen(v => !v)}>
                <IconShare size={14} /> Share
            </button>
            {open && (
                <div className="event-share-dropdown">
                    <button className="event-share-option" onClick={handleCopyLink}>
                        Copy Link
                    </button>
                    <button className="event-share-option" onClick={() => handleOpen(`https://twitter.com/intent/tweet?text=${text}&url=${href}`)}>
                        Twitter / X
                    </button>
                    <button className="event-share-option" onClick={() => handleOpen(`https://www.facebook.com/sharer/sharer.php?u=${href}`)}>
                        Facebook
                    </button>
                    <button className="event-share-option" onClick={() => handleOpen(`https://api.whatsapp.com/send?text=${text}%20${href}`)}>
                        WhatsApp
                    </button>
                </div>
            )}
        </div>
    );
}