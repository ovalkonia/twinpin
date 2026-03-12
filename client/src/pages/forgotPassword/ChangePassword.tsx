import React, { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import AuthLayout from "../../layouts/authlayout"

import { changePassword } from "../../services/auth";

const ChangePassword = () => {
    const navigate = useNavigate()

    const [password, setPassword] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'password') setPassword(value)
    if (name === 'passwordConfirm') setPasswordConfirm(value)
    }

    const handleInput = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const messageElement = document.querySelector("#checkPost")
        
        try {
            const data = {
                "password": password,
                "passwordConfirm": passwordConfirm,
            }
            const response = await changePassword(data)
            
            if (messageElement) {
                messageElement.innerHTML = `your password - ${response.password}`
                toast.success("Success")
                buttonRedirect("")
            } 
            
        } catch (error) {
            if (messageElement) {
                messageElement.innerHTML = `you get error - ${error}`
                toast.error("Error")
                buttonRedirect("")
            }
        }
    }

    const buttonRedirect = (link : string) =>{
        navigate(`/${link}`)
    }

    return (
        <AuthLayout>
            <h2>Change Password</h2>

            <form onSubmit={handleInput}>
                <label>Password:</label>
                <input 
                    type="password"
                    name="password" 
                    value={password} 
                    onChange={(e) => handleChange(e)}
                /><br></br>
                <label>Confirm password:</label>
                <input 
                    type="password"
                    name="passwordConfirm" 
                    value={passwordConfirm} 
                    onChange={(e) => handleChange(e)}
                /><br></br>
                <button type="submit">Send new password</button>
            </form>
            <div className="auth-links">
                <p id="checkPost"></p>
            </div>
        </AuthLayout>
    )
}

export default ChangePassword
