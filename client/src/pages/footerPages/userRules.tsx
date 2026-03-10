import '../../styles/info-pages.css';
import { SmallHeader } from "../../components/smallHeader";

export const UserRulesPage = () => {
    return(
        <div>
            <SmallHeader/>
            <div className="info-page">

                <h1>User Rules</h1>
                
                <section>
                    <h2>1. Account Registration</h2>
                    <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account.</p>
                </section>

                <section>
                    <h2>2. Prohibited Activities</h2>
                    <ul>
                        <li>Impersonating other users or organizations</li>
                        <li>Posting spam, fake events, or misleading information</li>
                        <li>Harassing other users or organizers</li>
                        <li>Using automated bots or scripts</li>
                        <li>Attempting to bypass payment systems</li>
                    </ul>
                </section>

                <section>
                    <h2>3. Event Creation Rules</h2>
                    <p>Event organizers must:</p>
                    <ul>
                        <li>Provide accurate event details (date, time, location)</li>
                        <li>Respect ticket limits and pricing</li>
                        <li>Communicate any changes or cancellations promptly</li>
                        <li>Not create duplicate or fake events</li>
                    </ul>
                </section>

                <section>
                    <h2>4. Ticket Purchases</h2>
                    <p>All ticket sales are final unless the event is canceled by the organizer. Refund requests must be directed to the event organizer.</p>
                </section>

                <section>
                    <h2>5. Content Guidelines</h2>
                    <p>Users may not post content that is:</p>
                    <ul>
                        <li>Illegal, offensive, or discriminatory</li>
                        <li>Sexually explicit or violent</li>
                        <li>Infringing on intellectual property rights</li>
                        <li>Containing malicious code or links</li>
                    </ul>
                </section>

                <section>
                    <h2>6. Account Termination</h2>
                    <p>We reserve the right to suspend or terminate accounts that violate these rules without notice. Repeated violations may result in permanent ban.</p>
                </section>

                <section>
                    <h2>7. Liability</h2>
                    <p>The platform is not responsible for events organized by third parties. All disputes between users and organizers must be resolved directly.</p>
                </section>

                <p className="last-updated">Last updated: March 2026</p>
            </div>            
        </div>

    );
};