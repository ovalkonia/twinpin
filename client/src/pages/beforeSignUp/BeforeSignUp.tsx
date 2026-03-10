import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBeforeReg from "../../layouts/headerBeforeReg";

import "../../styles/landing-page.css"

import { handleContactUs } from "../../services/help"


const PageBefortSignUp = () => 
{
    const navigate = useNavigate()
    const [nav, setNav] = useState(false);


    const [email, setEmail] = useState('')
    const [text, setText] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (name === 'email') setEmail(value)
        if (name === 'text') setText(value)
    }

    const contactUs = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const infoMassage = document.querySelector("#info")


        try {
            const data = {
                email: email,
                text: text,
            }
            
            const response = await handleContactUs(data)

            if(infoMassage) infoMassage.innerHTML = `Success - ${response}`

        } catch (err) {
            if(infoMassage) infoMassage.innerHTML = `${err}`
            console.error("Ошибка:", err)
        }
    }


    const buttonRedirect = (link : string) =>{
        navigate(`/${link}`)
    }


    return (
        <div className="landing-page" style={{ paddingTop: '100px' }}>
            <HeaderBeforeReg />
            
            <section id="home" className="section hero-section">
                <h1 className="hero-title">Find Your Perfect Event</h1>
                <p className="hero-subtitle">Discover thousands of events happening near you</p>
                <button className="cta-button" onClick={() => buttonRedirect("sign_up")}>
                    Get Started
                </button>
            </section>

            <section id="about" className="section about-section">
                <h2 className="section-title">About Us</h2>
                <p className="section-text">
                    We are a platform connecting people with amazing events. 
                    From concerts to workshops, we help you find experiences that matter.
                </p>
                <div className="stats-container">
                    <div className="stat-item">
                        <span className="stat-number">1000+</span>
                        <span className="stat-label">Events</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">50k+</span>
                        <span className="stat-label">Users</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">200+</span>
                        <span className="stat-label">Organizers</span>
                    </div>
                </div>
            </section>

            <section id="services" className="section services-section">
                <h2 className="section-title">Our Services</h2>
                <div className="services-grid">
                    <div className="service-card">
                        <div className="service-icon">🎟️</div>
                        <h3>Easy Booking</h3>
                        <p>Book tickets in seconds with our simple checkout process</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">📱</div>
                        <h3>Mobile Friendly</h3>
                        <p>Access your tickets anytime, anywhere on any device</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">💬</div>
                        <h3>Community</h3>
                        <p>Connect with other attendees and share experiences</p>
                    </div>
                    <div className="service-card">
                        <div className="service-icon">🔔</div>
                        <h3>Notifications</h3>
                        <p>Never miss an event with personalized reminders</p>
                    </div>
                </div>
            </section>

            <section id="contact" className="section contact-section">
                <h2 className="section-title">Get in Touch</h2>
                <div className="contact-container">
                    <div className="contact-info">
                        <p>📧 hello@eventplatform.com</p>
                        <p>📞 +1 (555) 123-4567</p>
                        <p>📍 123 Event Street, New York, NY 10001</p>
                    </div>
                    <form className="contact-form" onSubmit={contactUs}>
                        <input type="email" placeholder="Your email" className="contact-input" onChange={handleChange}/>
                        <textarea name="text" placeholder="Your message" className="contact-textarea" onChange={handleChange}></textarea>
                        <button type="submit" className="contact-submit">Send Message</button>
                        <i id="info"></i>
                    </form>
                </div>
            </section>
        </div>
    );
}

export default PageBefortSignUp