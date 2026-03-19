import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';

import { PrivateRoute } from './components/PrivateRoute';
import Registration from './pages/registration/Registration';
import Login from './pages/login/Login';
import ForgotPassword from './pages/forgotPassword/ForgotPassword';
import ChangePassword from './pages/forgotPassword/ChangePassword';
import PageBeforeSignUp from './pages/beforeSignUp/BeforeSignUp';
import { UserRulesPage } from './pages/footerPages/userRules';
import { PrivacyPolicyPage } from './pages/footerPages/privacyPolicyPage';
import { HelpPage } from './pages/footerPages/helpPage';
import Footer from './components/footer';
import NotFoundPage from './pages/notFound/404';
import { AuthProvider } from './context/AuthContext';
import { MainPage } from './pages/home/MainPage.js';
import { ProfilePage } from './pages/profile/ProfilePage';
import EventPage from './pages/events/EventPage';
import AuthLayout from './layouts/authlayout';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [pathname]);
    return null;
}

function AppContent() {
    return (
        <div className="app-layout">
            <ScrollToTop />
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#1a1a1a',
                        color: '#e0e0e0',
                        border: '1px solid rgba(255, 107, 0, 0.3)',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                    },
                    success: {
                        iconTheme: { primary: '#ff6b00', secondary: '#1a1a1a' },
                    },
                    error: {
                        iconTheme: { primary: '#ff4444', secondary: '#1a1a1a' },
                    },
                }}
            />
            <Routes>
                <Route path="/" element={<PageBeforeSignUp />} />

                <Route
                    path="/auth"
                    element={
                        GOOGLE_CLIENT_ID
                            ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}><AuthLayout /></GoogleOAuthProvider>
                            : <AuthLayout />
                    }
                >
                    <Route index element={<Navigate to="sign-in" replace />} />
                    <Route path="sign-up" element={<Registration />} />
                    <Route path="sign-in" element={<Login />} />
                    <Route path="forgot-password" element={<ForgotPassword />} />
                    <Route path="change-password" element={<ChangePassword />} />
                </Route>

                <Route path="/info" element={<Outlet />}>
                    <Route path="rules" element={<UserRulesPage />} />
                    <Route path="privacy" element={<PrivacyPolicyPage />} />
                    <Route path="faq" element={<HelpPage />} />
                </Route>

                <Route path="/dashboard" element={<MainPage />} />
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/events/:id" element={<EventPage />} />

                <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Footer />
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;