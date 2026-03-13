import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from "react-hot-toast";

import { PrivateRoute } from './components/PrivateRoute'
import Registration from './pages/registration/Registration';
import Login from './pages/login/Login';
import ForgotPassword from './pages/forgotPassword/ForgotPassword';
import ChangePassword from './pages/forgotPassword/ChangePassword';
import PageBefortSignUp from './pages/beforeSignUp/BeforeSignUp';
import { UserRulesPage } from "./pages/footerPages/userRules"
import { PrivacyPolicyPage } from "./pages/footerPages/privacyPolicyPage"
import { HelpPage } from "./pages/footerPages/helpPage"
import Footer from './components/footer';
import NotFoundPage from "./pages/notFound/404"
import { AuthProvider } from './context/AuthContext';
import { AfterSignUp } from './pages/afterSignUp/AfterSignUp'
import AuthLayout from './layouts/authlayout';

function App() {
  return (
      <BrowserRouter>
          <AuthProvider>
              <Toaster position="top-center"/>
              <Routes>
                  <Route path="/" element={<PageBefortSignUp />} />

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

                  <Route
                      path="/dashboard"
                      element={
                          <PrivateRoute>
                              <Outlet />
                          </PrivateRoute>
                      }
                  >
                      <Route index element={<AfterSignUp />} />
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <Footer />
          </AuthProvider>
      </BrowserRouter>
  )
}

export default App;