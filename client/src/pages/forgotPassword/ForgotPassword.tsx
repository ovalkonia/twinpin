import React, { useState } from "react";
import AuthLayout from "../../layouts/authlayout"

import { forgotPassword } from "../../services/auth";

const ForgotPassword = () => {
    const [email, setEmail] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'email') setEmail(value)
    }

    const handleInput = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const messageElement = document.querySelector("#checkPost")
        if (messageElement) messageElement.innerHTML = "We received your request. Check your post"
        
        try {
            const response = await forgotPassword({ email })
            if (messageElement) messageElement.innerHTML = `your password - ${response.password}`
            
        } catch (error) {
            if (messageElement) messageElement.innerHTML = `you get error - ${error}`
        }


    }

    return (
        <AuthLayout>
            <h2>Forgot Password</h2>

            <form onSubmit={handleInput}>
                <label>Email:</label>
                <input 
                    type="email" 
                    name="email" 
                    value={email} 
                    onChange={(e) => handleChange(e)}
                /><br></br>
                <button type="submit">Send recovery link</button>
            </form>
            <div className="auth-links">
                <p id="checkPost"></p>
                <a href="/sign_in">Return to the entrence</a>
            </div>
        </AuthLayout>
    )
}

export default ForgotPassword
