import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Registration from './pages/registration/Registration';
import Login from './pages/login/Login';
import ForgotPassword from './pages/forgotPassword/ForgotPassword';
import PageBefortSignUp from './pages/beforeSignUp/BeforeSignUp';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign_up" element={<Registration />} />
        <Route path="/sign_in" element={<Login />} />
        <Route path="/forgot_password" element={<ForgotPassword />} />
        <Route path="/" element={<PageBefortSignUp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
