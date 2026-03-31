import api from "./api"
import { saveToken, removeToken } from './token';
import { UserProfile } from './user';

export interface AuthResponse {
    token: string;
    user: UserProfile;
}

export const registerUser = async (userData: {
    name: string
    email: string
    password: string
}): Promise<void> => {
    await api.post('/auth/register', userData)
}

export const loginUser = async (userData: {
    email: string
    password: string
}): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', userData)
    if (response.data.token) {
        saveToken(response.data.token)
    }
    return response.data
}

export const forgotPassword = async (userData: {
    email: string
}): Promise<void> => {
    await api.post('/auth/forgotPassword', userData)
}

export const changePassword = async (userData: {
    password: string
    passwordConfirm: string
}): Promise<void> => {
    await api.post('/auth/changePassword', userData)
}

export const logout = () => {
    removeToken()
}

export const getUserProfile = async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>('/users/me')
    return response.data
}