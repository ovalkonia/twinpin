import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import '../styles/header.css'



export const LogoutButton = () => {
    const navigate = useNavigate()
    const { logout } = useAuth()

    const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
        logout()
        toast.success("Logged out successfully")

        navigate("/sign-in")
    }

    return (
        <button 
            type="button" 
            onClick={handleLogout}
            className="logout-button"
            title="Logout"
        >
            Logout
        </button>
    )
}