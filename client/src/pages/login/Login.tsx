import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import toast from "react-hot-toast";
import { loginUser } from "../../services/auth";

const Login: React.FC = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
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

        toast.promise(
            loginUser(formData),
            {
                loading: 'Signing in...',
                success: (response) => {
                    if (response.token) {
                        localStorage.setItem('token', response.token);
                    }

                    navigate('/dashboard');

                    return `Welcome back, ${response.user?.name || 'User'}!`;
                },
                error: (err) => {
                    return err.response?.data?.message || 'Invalid credentials';
                },
            }
        );
    };

    return (
        <div>
            <h2>Sign in</h2>

            <form onSubmit={handleSubmit} className="auth-form">
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        placeholder="example@mail.com"
                        onChange={handleChange}
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
                        placeholder="••••••••"
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="submit-btn">
                    Sign in
                </button>
            </form>

            <div className="auth-links">
                <Link to="/auth/forgot-password">Forgot password?</Link>
                <Link to="/auth/sign-up" className="auth-link">
                    Don't have an account? Sign up
                </Link>
            </div>

            <div id="googleLog"></div>
        </div>
    );
};

export default Login;