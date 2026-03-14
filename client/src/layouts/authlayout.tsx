import { Outlet } from 'react-router-dom';
import '../styles/reg_log.css';

const AuthLayout = () => {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#1a1a1a'
        }}>
            <div className="auth-card">
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;