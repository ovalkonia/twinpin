import { useNavigate } from "react-router-dom";

import logoSvg from '../../assets/white.svg';
import '../../styles/header.css';

const HeaderBeforeReg = () => {
    const navigate = useNavigate()

    const buttonRedirect = (link : string) =>{
        navigate(`/${link}`)
    }

    return (
        <header>
            <img src={logoSvg} alt="logo"></img>
            <nav>
                <ul>
                    <li><a href="/">Home</a>   <a href="/about">About</a></li>
                    <li><a href="/services">Services</a>   <a href="/contact">Contact</a></li>
                </ul>
                <div>
                    <button onClick={() => buttonRedirect("sign_up")}>Sign Up</button>
                    <button onClick={() => buttonRedirect("sign_in")}>Sign In</button>
                </div>
            </nav>
        </header>
    );
}

export default HeaderBeforeReg