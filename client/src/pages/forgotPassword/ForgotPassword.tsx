import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { forgotPassword } from "../../services/auth";

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        toast.promise(
            forgotPassword({ email }),
            {
                loading: 'Sending recovery link...',
                success: (data) => `Recovery link sent to ${data.email || email}`,
                error: (err) => err.response?.data?.message || 'Something went wrong',
            }
        );
    };

    return (
        <>
            <h2>Forgot Password</h2>
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={email}
                        placeholder="example@mail.com"
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="submit-btn">
                    Send Link
                </button>
            </form>

            <div className="auth-links">
                <Link to="/auth/sign-in" className="return-link">
                    Return to sign in
                </Link>
            </div>
        </>
    );
};

export default ForgotPassword;