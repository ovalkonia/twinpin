import { Link } from 'react-router-dom';
import '../styles/footer.css';
import logoSvg from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <Link to="/" className="footer-brand">
          <img className="footer-logo" src={logoSvg} alt="Twinpin" />
          <span className="footer-brand-name">Twinpin</span>
        </Link>

        <nav className="footer-links">
          <Link to="/info/rules" className="footer-link">Rules</Link>
          <Link to="/info/privacy" className="footer-link">Privacy</Link>
          <Link to="/info/faq" className="footer-link">Help</Link>
        </nav>

        <p className="footer-copy">© 2026 Twinpin</p>
      </div>
    </footer>
  );
};

export default Footer;
