import { HeaderAfterReg } from '../../layouts/HeaderAfterReg'
import { useAuth } from '../../context/AuthContext'


export const AfterSignUp = () => {
    const { user } = useAuth()

    return (
        <div>
            <HeaderAfterReg />
            <div style={{ padding: '100px 20px', color: 'white' }}>
                <h1>Welcome, {user?.name}!</h1>
                <p>This is your dashboard</p>
                <p>Email: {user?.email}</p>
            </div>
        </div>
    )
}