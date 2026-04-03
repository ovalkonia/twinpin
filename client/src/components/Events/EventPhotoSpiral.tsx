import { useRef } from 'react';
import { IconCamera, IconPlay } from '../../assets/icons.tsx';

interface Props {
    photos: string[];
    onPhotoClick: (src: string) => void;
}

function isVideo(url: string): boolean {
    return /\/video\/upload\//.test(url) || /\.(mp4|mov|webm|ogg)(\?|$)/i.test(url);
}

export default function EventPhotoSpiral({ photos, onPhotoClick }: Props) {
    if (photos.length === 0) return null;

    const videoCount = photos.filter(isVideo).length;
    const photoCount = photos.length - videoCount;

    const labelParts: string[] = [];
    if (photoCount > 0) labelParts.push(`${photoCount} Photo${photoCount !== 1 ? 's' : ''}`);
    if (videoCount > 0) labelParts.push(`${videoCount} Video${videoCount !== 1 ? 's' : ''}`);

    return (
        <section className="event-spiral-wrap">
            <div className="event-spiral-label">
                <IconCamera size={13} />
                {labelParts.join(' · ')}
            </div>
            <div className="event-spiral">
                {photos.map((src, i) => (
                    <SpiralItem key={i} src={src} index={i} onClick={() => onPhotoClick(src)} />
                ))}
            </div>
        </section>
    );
}

function SpiralItem({ src, index, onClick }: { src: string; index: number; onClick: () => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const video = isVideo(src);

    return (
        <button
            className="event-spiral-item"
            onClick={onClick}
            aria-label={`View ${video ? 'video' : 'photo'} ${index + 1}`}
        >
            {video ? (
                <>
                    <video
                        ref={videoRef}
                        src={src}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="event-spiral-video"
                        onMouseEnter={() => videoRef.current?.play()}
                        onMouseLeave={() => { if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }}
                    />
                    <span className="event-spiral-play-badge" aria-hidden>
                        <IconPlay size={12} />
                    </span>
                </>
            ) : (
                <img src={src} alt={`Event photo ${index + 1}`} />
            )}
        </button>
    );
}
