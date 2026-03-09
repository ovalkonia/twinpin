import api from "./api"

export const registerUser = async (userData : {
    name : string
    email : string
    password : string
}) => {
    try{
        const response = await api.post('/auth/register', userData)
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