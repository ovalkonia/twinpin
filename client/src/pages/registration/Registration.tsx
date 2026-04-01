import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";
import { registerUser } from '../../services/auth';

const Registration: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
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

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        const payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password
        };

        toast.promise(
            registerUser(payload),
            {
                loading: 'Creating account...',
                success: () => {
                    navigate('/auth/sign-in');
                    return `Welcome, ${formData.name}! Please log in.`;
                },
                error: (err) => err.response?.data?.message || 'Registration failed',
            }
        );
    };

    return (
        <>
            <h2>Sign up</h2>

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                    <label htmlFor="name">Full name</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@mail.com"
                        required
                    />
                </div>

                <div className="input-group">
                    <label htmlFor="password">Password</label>
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
                    <label htmlFor="confirmPassword">Confirm password</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="auth-button">
                    Create Account
                </button>
            </form>

            <div className="auth-links">
                <Link to="/auth/sign-in" className="auth-link">
                    Already have an account?
                </Link>
            </div>
        </>
    );
};

export default Registration;