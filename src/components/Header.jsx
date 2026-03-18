import { useNavigate, Link } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../utils/auth';

export default function Header() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    function handleLogout() {
        logoutUser();
        navigate('/');
    }

    return (
        <header className="header">
            <div className="header-inner">
                <Link to="/" className="header-logo">FairLance</Link>
                <nav className="header-nav">
                    {user ? (
                        <>
                            <span className="header-username">Hi, {user.name.split(' ')[0]}</span>
                            <button className="btn btn-ghost" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost">Login</Link>
                            <Link to="/signup" className="btn btn-primary">Sign Up</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
