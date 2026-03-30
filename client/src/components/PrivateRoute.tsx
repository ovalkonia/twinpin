import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface PrivateRouteProps {
    children: ReactNode
}

export const PrivateRoute = ( { children } : PrivateRouteProps ) => {
    const { isAuth, loading } = useAuth()

    if (loading) {
        return <div>Loading...</div>
    }

    if (!isAuth) {
        return <Navigate to="/auth/sign-in" replace />
    }

    return <>{children}</>
}