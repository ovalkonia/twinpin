import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconBell, IconBuilding, IconChevron, IconClose, IconLogOut, IconTicket, IconUser } from '../../assets/icons';

interface BurgerMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

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
                    <button className="burger-item" onClick={() => goTo(`/profile/${user?.id}`)}>
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