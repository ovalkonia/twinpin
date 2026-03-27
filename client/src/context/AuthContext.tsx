import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { getToken, saveToken, removeToken } from '../services/token'
import { getUserProfile } from '../services/auth'

export interface User {
    id: string
    name: string
    email: string
}

interface AuthContextType {
    user: User | null
    isAuth: boolean
    loading: boolean
    login: (token: string, userData: User) => void
    logout: () => void
}

interface AuthProviderProps {
    children: ReactNode
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            const token = getToken()
            if (token) {
                try {
                    const userData = await getUserProfile()
                    setUser(userData)
                } catch {
                    removeToken()
                }
            }
            setLoading(false)
        }
        checkAuth()
    }, [])

    const login = (token: string, userData: User) => {
        saveToken(token)
        setUser(userData)
    }

    const logout = () => {
        removeToken()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, isAuth: !!user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within AuthProvider')
    return context
}