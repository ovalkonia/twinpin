import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { UserAvatar } from './UserAvatar'
import './header.css'

const Header: React.FC = () => {
    const { isAuth } = useAuth()
    const navigate = useNavigate()

    return (
        <header className="header">
            <div className="header-brand" onClick={() => navigate('/')} role="link">
                <img src="" alt="Twinpin logo" />
                <span className="header-brand-name">Twinpin</span>
            </div>

            <div className="header-search">
                <input
                    type="text"
                    placeholder="Search..."
                    className="header-search-input"
                />
            </div>

            <div className="header-actions">
                {isAuth ? (
                    <UserAvatar />
                ) : (
                    <button className="login-btn" onClick={() => navigate('/sign-in')}>
                        Login
                    </button>
                )}
            </div>
        </header>
    )
}

export default Header