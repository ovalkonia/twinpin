import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const UserAvatar = () => {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const goTo = (path: string) => {
        navigate(path)
        setIsOpen(false)
    }

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <div className="user-avatar-wrapper" ref={wrapperRef}>
            <button
                className="avatar-btn"
                onClick={() => setIsOpen(prev => !prev)}
                aria-label="User menu"
            >
                {user?.name?.[0]?.toUpperCase() || 'U'}
            </button>

            {isOpen && (
                <div className="avatar-dropdown">
                    <div className="dropdown-user-info">
                        <span className="dropdown-user-name">{user?.name}</span>
                        <span className="dropdown-user-email">{user?.email}</span>
                    </div>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item" onClick={() => goTo(`/profile/${user?.id}`)}>
                        My Profile
                    </button>
                    <button className="dropdown-item" onClick={() => goTo('/company/register')}>
                        Register Company
                    </button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            )}
        </div>
    )
}