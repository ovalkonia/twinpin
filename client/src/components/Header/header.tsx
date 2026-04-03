import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BurgerMenu } from './BurgerMenu';
import Notifications from './Notification';
import { IconMenu } from '../../assets/icons';
import logoSvg from '../../assets/white.svg';
import './header.css';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const { isAuth } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchVal, setSearchVal] = useState('');

    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        const q = searchVal.trim();
        navigate(q ? `/dashboard?q=${encodeURIComponent(q)}` : '/dashboard');
    };

    return (
        <>
            <header className="header">
                <div className="header-brand" onClick={() => navigate('/dashboard')} role="link">
                    <img src={logoSvg} alt="Twinpin logo" />
                    <span className="header-brand-name">Twinpin</span>
                </div>

                <div className="header-search">
                    <input
                        type="text"
                        placeholder="Search events..."
                        className="header-search-input"
                        value={searchVal}
                        onChange={e => setSearchVal(e.target.value)}
                        onKeyDown={handleSearch}
                    />
                </div>

                <div className="header-actions">
                    {isAuth ? (
                        <>
                            <Notifications />

                            <button
                                className="header-icon-btn"
                                onClick={() => setMenuOpen(true)}
                                aria-label="Open menu"
                            >
                                <IconMenu size={20} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="header-auth-btn header-auth-btn--ghost" onClick={() => navigate('/auth/sign-in')}>
                                Sign In
                            </button>
                            <button className="header-auth-btn" onClick={() => navigate('/auth/sign-up')}>
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </header>

            {isAuth && <BurgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />}
        </>
    );
};

export default Header;