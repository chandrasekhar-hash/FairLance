import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

const CLIENT_NAV = [
    { icon: '🏠', label: 'Dashboard', to: '/client-dashboard' },
    { icon: '📁', label: 'My Projects', to: '/my-projects' },
    { icon: '💳', label: 'Payments', to: '/payments' },
    { icon: '🔔', label: 'Notifications', to: '/notifications' },
    { icon: '👤', label: 'Profile', to: '/profile' },
];

const FREELANCER_NAV = [
    { icon: '🏠', label: 'Dashboard', to: '/freelancer-dashboard' },
    { icon: '📁', label: 'My Projects', to: '/my-projects' },
    { icon: '💰', label: 'Earnings', to: '/earnings' },
    { icon: '🔔', label: 'Notifications', to: '/notifications' },
    { icon: '👤', label: 'Profile', to: '/profile' },
];

export default function Sidebar() {
    const user = getCurrentUser();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const navLinks = user?.role === 'client' ? CLIENT_NAV : FREELANCER_NAV;
    const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : '?';

    function handleLogout() {
        localStorage.removeItem('fairlance_current_user');
        navigate('/');
    }

    function closeMobile() {
        setMobileOpen(false);
    }

    return (
        <>
            {/* Hamburger button — mobile only */}
            <button
                className="sidebar-hamburger"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Overlay backdrop — mobile only */}
            {mobileOpen && (
                <div className="sidebar-overlay" onClick={closeMobile} />
            )}

            {/* Sidebar panel */}
            <aside className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}>
                {/* Close button — mobile only */}
                <button className="sidebar-close" onClick={closeMobile} aria-label="Close menu">✕</button>

                {/* Logo */}
                <div className="sidebar-logo">FairLance</div>

                {/* Profile block */}
                <div className="sidebar-profile">
                    <div className="sidebar-avatar">{avatarLetter}</div>
                    <div className="sidebar-profile-info">
                        <p className="sidebar-profile-name">{user?.name}</p>
                        <p className="sidebar-profile-role">
                            {user?.role === 'client' ? '🏢 Client' : '💼 Freelancer'}
                        </p>
                    </div>
                </div>

                {/* Nav links */}
                <nav className="sidebar-nav">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            onClick={closeMobile}
                            className={({ isActive }) =>
                                `sidebar-nav-link ${isActive ? 'sidebar-nav-link--active' : ''}`
                            }
                        >
                            <span className="sidebar-nav-icon">{link.icon}</span>
                            <span>{link.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer logout */}
                <div className="sidebar-footer">
                    <button className="sidebar-logout-btn" onClick={handleLogout}>
                        <span>🚪</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
