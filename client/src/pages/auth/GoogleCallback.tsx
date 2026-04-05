import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { saveToken } from '../../services/token';

const GoogleCallback = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const id = params.get('id');
        const name = params.get('name');
        const email = params.get('email');

        if (!token || !email) {
            toast.error('Google sign-in failed. Please try again.');
            navigate('/auth/sign-in', { replace: true });
            return;
        }

        saveToken(token);
        login(token, { id: id ?? '', name: name ?? '', email });
        toast.success(`Welcome, ${name || 'User'}!`);
        navigate('/dashboard', { replace: true });
    }, []);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            backgroundColor: '#0a0a0a',
            color: '#e0e0e0',
            gap: '16px',
        }}>
            <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(255,107,0,0.2)',
                borderTopColor: '#ff6b00',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
            }} />
            <p style={{ color: '#999', fontSize: '15px' }}>Signing you in...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default GoogleCallback;