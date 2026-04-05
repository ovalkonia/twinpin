import { Outlet } from 'react-router-dom';
import '../styles/reg_log.css';

const AuthLayout = () => {
    return (
        <div style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0a0a0a',
        }}>
            <div className="auth-card">
                <Outlet />
            </div>
        </div>
    );
};

export default AuthLayout;