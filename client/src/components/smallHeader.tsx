import { useNavigate } from 'react-router-dom';
import '../styles/info-pages.css';

export const SmallHeader = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <button className="back-btn" onClick={handleBack} aria-label="Go back">
            <span className="back-btn-arrow">←</span>
            Back
        </button>
    );
};
