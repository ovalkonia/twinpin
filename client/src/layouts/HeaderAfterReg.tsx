import { MiniProfile } from '../components/MiniProfile'
import '../styles/header.css'

export const HeaderAfterReg = () => {
    return (
        <header className="fixed-header">
            {/* <BigNavigation /> сделаем потом */}
            <MiniProfile />
        </header>
    )   
}