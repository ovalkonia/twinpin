import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BurgerMenu } from './BurgerMenu';
import logoSvg from '../../assets/white.svg';
import './header.css';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const { isAuth } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

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
                    />
                </div>

                <div className="header-actions">
                    {isAuth ? (
                        <>
                            <button className="header-icon-btn" aria-label="Notifications">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                            </button>

                            <button
                                className="header-icon-btn"
                                onClick={() => setMenuOpen(true)}
                                aria-label="Open menu"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="3" y1="6"  x2="21" y2="6"  />
                                    <line x1="3" y1="12" x2="21" y2="12" />
                                    <line x1="3" y1="18" x2="21" y2="18" />
                                </svg>
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