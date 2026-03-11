import React, { useState } from "react"
import { useNavigate } from 'react-router-dom'
import toast from "react-hot-toast"

import AuthLayout from "../../layouts/authlayout"
import { registerUser } from '../../services/auth'

const Registration = () => {
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setconfirmPassword] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        if (name === 'email') setEmail(value)
        if (name === 'name') setName(value)
        if (name === 'password') setPassword(value)
        if (name === 'confirmPassword') setconfirmPassword(value)
    
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error("Passwords don't match")
            return
        }

        const data = {
            name: name,
            email: email,
            password: password,
        }

        toast.promise(
            registerUser(data),
            {
                loading: 'Creating account...',
                success: (response) => {
                    navigate('/')
                    return `Welcome, ${name}! Registration successful`
                },
                error: (err) => `Error: ${err.message || 'Registration failed'}`,
            }
        )
    }

    return (
        <AuthLayout>
            <h2>Sign up</h2>

            <form onSubmit={handleSubmit}>
                <label>Nickname:</label>
                <input 
                    type="name" 
                    name="name" 
                    value={name} 
                    onChange={(e) => handleChange(e)}
                /><br></br>
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
                <label >Confirm password:</label>
                <input 
                    type="password" 
                    name="confirmPassword" 
                    value={confirmPassword} 
                    onChange={(e) => handleChange(e)}
                /><br></br>
                <button type="submit">Confirm</button>
            </form>

            <div className="auth-links">
                <p id="info"></p>
                <a href="/sign-in">Already have an account? Sign in</a>
            </div>
            <div id="googleReg"></div>

        </AuthLayout>
    )
}

export default Registration