import React from 'react';

interface IconProps {
    size?: number;
}

const defaults = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconBell: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

export const IconUser: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

export const IconTicket: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
    </svg>
);

export const IconBuilding: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M9 22V12h6v10M3 9h18M3 15h18" />
    </svg>
);

export const IconLogOut: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

export const IconChevron: React.FC<IconProps> = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

export const IconClose: React.FC<IconProps> = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export const IconMenu: React.FC<IconProps> = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <line x1="3" y1="6"  x2="21" y2="6"  />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

export const IconShare: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
);

export const IconMapPin: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

export const IconCalendar: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

export const IconClock: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

export const IconUsers: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export const IconChevronDown: React.FC<IconProps> = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export const IconCamera: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

export const IconGlobe: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

export const IconLinkedIn: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
    </svg>
);

export const IconInstagram: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

export const IconTelegram: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </svg>
);

export const IconTikTok: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

export const IconPlus: React.FC<IconProps> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" {...defaults}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);