import React, { useState } from "react"
import toast from "react-hot-toast"

import AuthLayout from "../../layouts/authlayout"

import { forgotPassword } from "../../services/auth"

const ForgotPassword = () => {
    const [email, setEmail] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'email') setEmail(value)
    }

    const handleInput = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        toast.promise(
            forgotPassword({ email }),
            {
                loading: 'Sending recovery link...',
                success: (data) => `Recovery link sent to ${data.email || email}`,
                error: (err) => `Error: ${err.message || 'Something went wrong'}`,
            }
        )
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
                <a href="/sign-in">Return to the entrence</a>
            </div>
        </AuthLayout>
    )
}

export default ForgotPassword
