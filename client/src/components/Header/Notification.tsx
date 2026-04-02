import React, {useCallback, useEffect, useRef, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import { IconBell } from '../../assets/icons';
import api from '../../services/api';
import toast from "react-hot-toast";


interface Notification {
    id: string;
    type: string;
    message: string;
    date: string;
    read: boolean;
    category: 'event' | 'ticket' | 'system';
    title: string;
}

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<Notification[]>('/notifications');
            setNotifications(response.data);
        } catch (error: any) {
            console.error("Could not fetch notifications", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDeleteNotification = async (notificationId: string) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            toast.error("Failed to delete");
        }
    };
    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button className="header-icon-btn notification-bell-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Notifications">
                <IconBell size={20} />
                {notifications.length > 0 && (
                    <span className="notification-badge">{notifications.length}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="notification-header">
                        <h3>Notifications</h3>
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <p className="notification-status">Loading...</p>
                        ) : notifications.length === 0 ? (
                            <p className="notification-status">No notifications</p>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className="notification-item">
                                    <div
                                        className="notification-item-body"
                                        onClick={() => { navigate('/notifications'); setIsOpen(false); }}
                                    >
                                        <p className="notification-title">{n.title}</p>
                                        <p className="notification-author">{n.category}</p>
                                        <p className="notification-meta">{n.message} · {formatDate(n.date)}</p>
                                    </div>
                                    <button className="notification-delete-btn" onClick={() => handleDeleteNotification(n.id)}>&times;</button>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="notification-footer">
                        <Link to="/notifications" className="notification-see-all" onClick={() => setIsOpen(false)}>
                            See all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Notifications;