import api from "./api"
import { saveToken, getToken, removeToken } from './token';

export const registerUser = async (userData : {
    name : string
    email : string
    password : string
}) => {
    try{
        const response = await api.post('/auth/register', userData)
        if (response.data.token) {
            saveToken(response.data.token)
        }
        return response.data
    } catch (err){
        throw err
    }
}


export const loginUser = async (userData : {
    email : string
    password : string
}) => {
    try {
        const response = await api.post("/auth/login", userData)
        if (response.data.token) {
            saveToken(response.data.token)
        }
        return response.data
    } catch (err) {
        throw err
    }
}

export const forgotPassword = async (userData : {
    email : string
}) => {
    try {
        const response = await api.post("/auth/forgotPassword", userData)
        return response.data
    } catch (err) {
        throw err
    }
}

export const changePassword = async (userData : {
    password : string
    passwordConfirm : string
}) => {
    try {
        const response = await api.post("/auth/changePassword", userData)
        return response.data
    } catch (err) {
        throw err
    }
}

export const logout = () => {
    removeToken()
    //reset page
}

export const getUserProfile = async () => {
    try {
        const response = await api.get('/users/me')
        return response.data
    } catch (err) {
        throw err
    }
}