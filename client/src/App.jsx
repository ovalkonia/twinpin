import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Registration from './pages/registration/Registration';
import Login from './pages/login/Login';
import ForgotPassword from './pages/forgotPassword/ForgotPassword';
import PageBefortSignUp from './pages/beforeSignUp/BeforeSignUp';

import { UserRulesPage } from "./pages/footerPages/userRules"
import { PrivacyPolicyPage } from "./pages/footerPages/privacyPolicyPage"
import { HelpPage } from "./pages/footerPages/helpPage"

import Footer from './components/footer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageBefortSignUp />} />
        <Route path="/sign_up" element={<Registration />} />
        <Route path="/sign_in" element={<Login />} />
        <Route path="/forgot_password" element={<ForgotPassword />} />
        <Route path="/rules" element={<UserRulesPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/faq" element={<HelpPage />} />
        
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
