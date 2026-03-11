import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster />
        <Routes>
          <Route path="/" element={<PageBefortSignUp />} />
          <Route path="/sign-up" element={<Registration />} />
          <Route path="/sign-in" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/rules" element={<UserRulesPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/faq" element={<HelpPage />} />
          <Route path="/dashboard" element={<PrivateRoute><AfterSignUp /></PrivateRoute>} />
          <Route path="*" element={<NotFoundPage />} />  
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;