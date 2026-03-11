import { useNavigate } from 'react-router-dom';
import '../../styles/404.css';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1 className="error-code">404</h1>
                <h2 className="error-title">Page Not Found</h2>
                <p className="error-message">
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>
                <div className="error-actions">
                    <button onClick={() => navigate(-1)} className="btn-back">
                        ← Go Back
                    </button>
                    <button onClick={() => navigate('/')} className="btn-home">
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;