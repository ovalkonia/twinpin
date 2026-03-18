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