import '../../styles/info-pages.css';
import { SmallHeader } from "../../components/smallHeader";


export const PrivacyPolicyPage = () => {
    return(
        <div>
            <SmallHeader/>
            <div className="info-page">
                <h1>Privacy Policy</h1>
                
                <section>
                    <h2>What Data We Collect</h2>
                    <ul>
                        <li>Email address</li>
                        <li>Full name (optional)</li>
                        <li>Profile information</li>
                        <li>Event registration history</li>
                        <li>Payment information (processed securely by Stripe)</li>
                    </ul>
                </section>

                <section>
                    <h2>How We Use Your Data</h2>
                    <ul>
                        <li>Send event notifications and updates</li>
                        <li>Process ticket purchases</li>
                        <li>Improve our services</li>
                        <li>Communicate with you about your account</li>
                        <li>Send marketing emails (with your consent)</li>
                    </ul>
                </section>

                <section>
                    <h2>Who Has Access</h2>
                    <ul>
                        <li>Platform administrators</li>
                        <li>Event organizers (only your name for attendee lists)</li>
                        <li>Payment processors (Stripe)</li>
                        <li>We never sell your personal data</li>
                    </ul>
                </section>

                <section>
                    <h2>How to Delete Your Account</h2>
                    <p>You can delete your account in Profile Settings or contact support at privacy@eventplatform.com. Data deletion may take up to 30 days.</p>
                </section>

                <p className="last-updated">Last updated: March 2026</p>
            </div>
        </div>

    );
};