import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/Header/header';
import { useAuth } from '../../context/AuthContext';
import { getUserById, updateUser } from '../../services/user';
import '../../styles/profile.css';

export function EditProfilePage() {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [nameInput, setNameInput] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    useEffect(() => {
        if (!currentUser?.id) return;
        getUserById(currentUser.id).then(u => {
            setNameInput(u.name);
            setEmail(u.email);
        }).catch(() => {});
    }, [currentUser?.id]);

    const handleSaveProfile = async () => {
        if (!currentUser?.id) return;
        setSavingProfile(true);
        try {
            await updateUser(currentUser.id, { name: nameInput });
            toast.success('Profile updated');
            navigate('/profile');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!currentUser?.id) return;
        if (!newPassword) { toast.error('Enter a new password'); return; }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
        setSavingPassword(true);
        try {
            await updateUser(currentUser.id, { password: newPassword });
            toast.success('Password updated');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch {
            toast.error('Failed to update password');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="profile-page">
            <Header />
            <div className="profile-content">

                <section className="profile-card" style={{ animationDelay: '0s' }}>
                    <div className="profile-card-left">
                        <div className="profile-identity">
                            <h1 className="profile-name">Edit Profile</h1>
                            <p className="profile-email">{email}</p>
                        </div>
                    </div>
                </section>

                <section className="profile-section" style={{ animationDelay: '0.08s' }}>
                    <h2 className="profile-section-title">Settings &amp; Security</h2>
                    <div className="settings-grid">

                        <div className="settings-card">
                            <h3 className="settings-card-title">Edit Profile</h3>
                            <form onSubmit={e => { e.preventDefault(); handleSaveProfile(); }} className="settings-form">
                                <label className="settings-label">Display name</label>
                                <input
                                    className="settings-input"
                                    type="text"
                                    value={nameInput}
                                    onChange={e => setNameInput(e.target.value)}
                                    placeholder="Your name"
                                />
                                <label className="settings-label">Email</label>
                                <input
                                    className="settings-input"
                                    type="email"
                                    value={email}
                                    readOnly
                                    disabled
                                />
                                <button type="submit" className="settings-btn" disabled={savingProfile}>
                                    {savingProfile ? 'Saving…' : 'Save changes'}
                                </button>
                            </form>
                        </div>

                        <div className="settings-card">
                            <h3 className="settings-card-title">Change Password</h3>
                            <form onSubmit={e => { e.preventDefault(); handleUpdatePassword(); }} className="settings-form">
                                <label className="settings-label">Current password</label>
                                <input
                                    className="settings-input"
                                    type="password"
                                    value={currentPassword}
                                    onChange={e => setCurrentPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <label className="settings-label">New password</label>
                                <input
                                    className="settings-input"
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <label className="settings-label">Confirm new password</label>
                                <input
                                    className="settings-input"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <button type="submit" className="settings-btn" disabled={savingPassword}>
                                    {savingPassword ? 'Updating…' : 'Update password'}
                                </button>
                            </form>
                        </div>

                    </div>
                </section>

            </div>
        </div>
    );
}
