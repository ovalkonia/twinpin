import { useState, useEffect } from "react"; // добавить импорт

import '../styles/header.css';

export const SmallHeader = () => {
    const [scrolled, setScrolled] = useState(false);

    // Эффект для отслеживания скролла
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



    return (
        <header className={`fixed-header ${scrolled ? 'scrolled' : ''}`}>
            <nav>
                <ul>
                    <li>
                        <a href="/" style={{fontSize : "20px"}}>Home</a>
                    </li>
                </ul>
            </nav>
        </header>
    );
};
