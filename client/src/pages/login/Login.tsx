import React, { useState } from "react";
import { useNavigate } from 'react-router-dom'

import AuthLayout from "../../layouts/authlayout"
import { loginUser } from "../../services/auth";

import '../../styles/reg_log.css'

const Login = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'email') setEmail(value)
    if (name === 'password') setPassword(value)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const infoMassage = document.querySelector("#info")

        try {
            const data = {
                email: email,
                password: password,
            }
            
            const response = await loginUser(data)

            if(infoMassage) infoMassage.innerHTML = `Success - ${response}`
            localStorage.setItem('token', response.token)
            navigate('/');
            
        } catch (error) {
            if(infoMassage) infoMassage.innerHTML = `${error}`
            console.error("Ошибка:", error)
        }
       
    }

    return (
        <AuthLayout>
            <h2>Sign in</h2>
            <form onSubmit={handleSubmit}>
                <label>Email:</label>
                <input 
                    type="email" 
                    name="email" 
                    value={email} 
                    onChange={(e) => handleChange(e)}
                /><br></br>
                <label >Password:</label>
                <input 
                    type="password" 
                    name="password" 
                    value={password} 
                    onChange={(e) => handleChange(e)}
                /><br></br>
                <button type="submit">Sign in</button>
            </form>

            <div className="auth-links">
                <p id="info"></p>
                <a href="/forgot_password">Forgot password?</a>
                <br />
                <a href="/sign_up">Don't have an account? Sign up</a>
            </div>
            <div id="googleLog"></div>

        </AuthLayout>
    )
}

export default Login