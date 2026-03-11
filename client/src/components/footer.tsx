import '../styles/footer.css';
import logoSvg from '../assets/white.svg';
import logoGit from '../assets/white_git.svg';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-section brand-section">
          <img className="footer-icon" src={logoSvg}></img>
          <div className="footer-name">EventPlatform</div>
        </div>

        <div className="footer-section links-section">
          <a href="/rules" className="footer-link">User Rules</a>
          <a href="/privacy" className="footer-link">Privacy Policy</a>
          <a href="/faq" className="footer-link">Help / FAQ</a>
        </div>

        <div className="footer-section social-section">
          <a href="https://github.com/ovalkonia/twinpin" className="social-link" target="_blank" rel="noopener noreferrer">
            <img className="social-icon" src={logoGit}></img> 
          </a>
        </div>

        <div className="footer-section copyright-section">
          © 2026 Project Name. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;