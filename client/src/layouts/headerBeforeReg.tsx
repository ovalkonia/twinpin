import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import logoSvg from '../../assets/white.svg';
import '../../styles/header.css';

const HeaderBeforeReg = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        e.preventDefault();
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const buttonRedirect = (link: string) => {
        navigate(`/${link}`);
    };

    return (
        <header className={`fixed-header ${scrolled ? 'scrolled' : ''}`}>
            <img src={logoSvg} alt="logo" />
            <nav>
                <ul>
                    <li>
                        <a href="#home" onClick={(e) => scrollToSection(e, 'home')}>Home</a>
                        <a href="#about" onClick={(e) => scrollToSection(e, 'about')}>About</a>
                    </li>
                    <li>
                        <a href="#services" onClick={(e) => scrollToSection(e, 'services')}>Services</a>
                        <a href="#contact" onClick={(e) => scrollToSection(e, 'contact')}>Contact</a>
                    </li>
                </ul>
                <div className="auth-buttons">
                    <button onClick={() => buttonRedirect("sign-up")}>Sign Up</button>
                    <button onClick={() => buttonRedirect("sign-in")}>Sign In</button>
                </div>
            </nav>
        </header>
    );
}

export default HeaderBeforeReg;