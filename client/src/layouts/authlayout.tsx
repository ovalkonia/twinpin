// Импортируем React (нужен для JSX)
import React from 'react';


const AuthLayout = ({ children } : { children: React.ReactNode }) => {
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#1a1a1a'  // темный фон
        }}>
            <div className="auth-card">
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;