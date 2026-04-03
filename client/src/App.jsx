import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from "react-hot-toast";
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
import { EditProfilePage } from './pages/profile/EditProfilePage';
import { TicketsPage } from './pages/tickets/TicketsPage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import EventPage from './pages/events/EventPage';
import { EditEventPage } from './pages/events/EditEventPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { RegisterCompanyPage } from './pages/company/RegisterCompanyPage';
import { CompanyPage } from './pages/company/CompanyPage';
import { EditCompanyPage } from './pages/company/EditCompanyPage';
import { CreateEventPage } from './pages/events/CreateEventPage';
import AuthLayout from './layouts/authlayout';
import GoogleCallback from './pages/auth/GoogleCallback';

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

                <Route path="/auth/callback" element={<GoogleCallback />} />

                <Route path="/auth" element={<AuthLayout />}>
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
                <Route path="/profile/edit" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
                <Route path="/profile/:userId" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/tickets" element={<PrivateRoute><TicketsPage /></PrivateRoute>} />
                <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
                <Route path="/company" element={<PrivateRoute><CompanyPage /></PrivateRoute>} />
                <Route path="/company/register" element={<PrivateRoute><RegisterCompanyPage /></PrivateRoute>} />
                <Route path="/company/edit" element={<PrivateRoute><EditCompanyPage /></PrivateRoute>} />
                <Route path="/company/:slug" element={<CompanyPage />} />
                <Route path="/checkout/:eventId" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
                <Route path="/events/create" element={<PrivateRoute><CreateEventPage /></PrivateRoute>} />
                <Route path="/events/:id" element={<EventPage />} />
                <Route path="/event/:id" element={<EventPage />} />
                <Route path="/events/:id/edit" element={<PrivateRoute><EditEventPage /></PrivateRoute>} />

                {/* Compatibility routes referenced by header UI */}
                <Route path="/dashboard/my-tickets" element={<PrivateRoute><TicketsPage /></PrivateRoute>} />
                <Route path="/dashboard/settings" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/dashboard/post/:eventId" element={<EventPage />} />

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