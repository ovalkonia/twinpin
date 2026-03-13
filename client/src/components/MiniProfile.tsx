import { useAuth } from "../context/AuthContext"
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { LogoutButton } from './LogoutButton' 
import '../styles/header.css'

export const MiniProfile = () => {

    const { user, logout} = useAuth()
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    const goTo = (path: string) => {
        navigate(path)
        setIsMenuOpen(false)
    }

    return (
        <div className="mini-profile">
            <div className="profile-info" onClick={() => goTo('/profile')}>
                <div className="avatar">{user?.name?.[0] || 'U'}</div>
                <span className="username">{user?.name || 'User'}</span>
            </div>

            <button className="menu-button" onClick={toggleMenu}>▼</button>

            <LogoutButton />

            {isMenuOpen && (
                <div className="dropdown-menu">
                    <div onClick={() => goTo('/dashboard')}>Profile</div>
                    <div onClick={() => goTo('/dashboard/my-tickets')}>My Tickets</div>
                    <div onClick={() => goTo('/dashboard/settings')}>Settings</div>
                </div>
            )}
        </div>  
    )
}