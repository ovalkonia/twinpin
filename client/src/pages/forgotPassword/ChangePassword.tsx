import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { changePassword } from "../../services/auth";

const ChangePassword: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        password: '',
        passwordConfirm: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (formData.password !== formData.passwordConfirm) {
            toast.error("Passwords do not match");
            return;
        }

        toast.promise(
            changePassword(formData),
            {
                loading: 'Updating password...',
                success: () => {
                    navigate('/auth/sign-in');
                    return "Password changed successfully! Please log in.";
                },
                error: (err) => err.response?.data?.message || "Failed to change password",
            }
        );
    };

    return (
        <div>
            <h2>Change Password</h2>

            <p className="auth-description">
                Please enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                    <label htmlFor="password">New Password</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="passwordConfirm">Confirm New Password</label>
                    <input
                        id="passwordConfirm"
                        type="password"
                        name="passwordConfirm"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="submit-btn">
                    Update Password
                </button>
            </form>

            <div className="auth-links">
                <button
                    className="return-link"
                    onClick={() => navigate('/auth/sign-in')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Back to sign in
                </button>
            </div>
        </div>
    );
};

export default ChangePassword;