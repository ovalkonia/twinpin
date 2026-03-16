import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface BurgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const IconUser = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);

const IconTicket = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
    </svg>
);

const IconBuilding = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="1" /><path d="M9 22V12h6v10M3 9h18M3 15h18" />
    </svg>
);

const IconBell = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const IconLogOut = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

const IconChevron = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const IconClose = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export const BurgerMenu = ({ isOpen, onClose }: BurgerMenuProps) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const goTo = (path: string) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        logout();
        navigate('/');
        onClose();
    };

    return (
        <>
            <div
                className={`burger-backdrop ${isOpen ? 'burger-backdrop--visible' : ''}`}
                onClick={onClose}
            />
            <div
                ref={drawerRef}
                className={`burger-drawer ${isOpen ? 'burger-drawer--open' : ''}`}
                aria-hidden={!isOpen}
            >
                <button className="burger-close" onClick={onClose} aria-label="Close menu">
                    <IconClose />
                </button>

                <div className="burger-user">
                    <div className="burger-avatar">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="burger-user-info">
                        <span className="burger-user-name">{user?.name}</span>
                        <span className="burger-user-email">{user?.email}</span>
                    </div>
                </div>

                <div className="burger-divider" />

                <nav className="burger-nav">
                    <button className="burger-item" onClick={() => goTo('/profile')}>
                        <span className="burger-item-icon"><IconUser /></span>
                        My Profile
                        <span className="burger-item-arrow"><IconChevron /></span>
                    </button>
                    <button className="burger-item" onClick={() => goTo('/tickets')}>
                        <span className="burger-item-icon"><IconTicket /></span>
                        My Tickets
                        <span className="burger-item-arrow"><IconChevron /></span>
                    </button>
                    <button className="burger-item" onClick={() => goTo('/company')}>
                        <span className="burger-item-icon"><IconBuilding /></span>
                        Company Profile
                        <span className="burger-item-arrow"><IconChevron /></span>
                    </button>
                    <button className="burger-item" onClick={() => goTo('/notifications')}>
                        <span className="burger-item-icon"><IconBell /></span>
                        Notifications
                        <span className="burger-item-arrow"><IconChevron /></span>
                    </button>
                </nav>

                <div className="burger-divider" />

                <button className="burger-item burger-item--danger" onClick={handleLogout}>
                    <span className="burger-item-icon"><IconLogOut /></span>
                    Logout
                </button>
            </div>
        </>
    );
};