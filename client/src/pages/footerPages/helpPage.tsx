import { useState } from 'react';
import '../../styles/info-pages.css';

import { SmallHeader } from "../../components/smallHeader";


export const HelpPage = () => {
    const [openSection, setOpenSection] = useState<number | null>(null);

    const toggleSection = (index: number) => {
        setOpenSection(openSection === index ? null : index);
    };

    return(
        <div>
            <SmallHeader/>
            <div className="info-page">
                <h1>Help & FAQ</h1>

                <section className={`faq-section ${openSection === 0 ? 'open' : ''}`} onClick={() => toggleSection(0)}>
                    <div className="faq-question">
                        <h2>How do I register?</h2>
                    </div>
                    <div className="faq-answer">
                        <p>Click "Sign Up" in the top menu, fill in your email, name, and password. Confirm your email and you're ready to go!</p>
                    </div>
                </section>

                <section className={`faq-section ${openSection === 1 ? 'open' : ''}`} onClick={() => toggleSection(1)}>
                    <div className="faq-question">
                        <h2>How to buy a ticket?</h2>
                    </div>
                    <div className="faq-answer">
                        <p>Find an event, click "Buy Ticket", enter your details, and pay securely with Stripe. You'll receive the ticket by email.</p>
                    </div>
                </section>

                <section className={`faq-section ${openSection === 2 ? 'open' : ''}`} onClick={() => toggleSection(2)}>
                    <div className="faq-question">
                        <h2>How to create an event?</h2>
                    </div>
                    <div className="faq-answer">
                        <p>First create a company profile, then go to "Create Event" in your dashboard. Fill in event details, set ticket prices, and publish.</p>
                    </div>
                </section>

                <section className={`faq-section ${openSection === 3 ? 'open' : ''}`} onClick={() => toggleSection(3)}>
                    <div className="faq-question">
                        <h2>How to cancel registration?</h2>
                    </div>
                    <div className="faq-answer">
                        <p>Go to "My Tickets", find the event, and click "Cancel". Free events are instant cancellation. Paid events must contact organizer.</p>
                    </div>
                </section>

                <section className={`faq-section ${openSection === 4 ? 'open' : ''}`} onClick={() => toggleSection(4)}>
                    <div className="faq-question">
                        <h2>How to contact support?</h2>
                    </div>
                    <div className="faq-answer">
                        <p>Email us at support@eventplatform.com or use the contact form on our website. We usually reply within 24 hours.</p>
                    </div>
                </section>

                <section className={`faq-section ${openSection === 5 ? 'open' : ''}`} onClick={() => toggleSection(5)}>
                    <div className="faq-question">
                        <h2>Ticket didn't arrive?</h2>
                    </div>
                    <div className="faq-answer">
                        <p>Check your spam folder first. If not there, contact support with your payment details and we'll resend it.</p>
                    </div>
                </section>

                <p className="last-updated">Last updated: March 2026</p>
            </div>
        </div>

    );
};