import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { signUp } from '../utils/auth';

export default function SignupPage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "FairLance — Create Account";
    }, []);
    const [searchParams] = useSearchParams();
    const preselectedRole = searchParams.get('role') || 'client';

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(preselectedRole);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setIsLoading(false);
            return;
        }

        try {
            await signUp(name.trim(), email.trim(), password, role);
            if (role === 'client') {
                navigate('/client-dashboard');
            } else {
                navigate('/freelancer-dashboard');
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AuthCard>
            <h2 className="auth-card-title">Create your account</h2>
            <p className="auth-card-subtitle">Join thousands of professionals on FairLance</p>

            <form onSubmit={handleSubmit}>
                {error && <div className="form-error">{error}</div>}

                <div className="form-group">
                    <label className="form-label" htmlFor="name">Full Name</label>
                    <input
                        id="name"
                        className="form-input"
                        type="text"
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="email">Email Address</label>
                    <input
                        id="email"
                        className="form-input"
                        type="email"
                        placeholder="jane@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="password">Password</label>
                    <input
                        id="password"
                        className="form-input"
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <span className="role-selector-label">I want to…</span>
                    <div className="role-cards">
                        <div
                            className={`role-card ${role === 'client' ? 'selected' : ''} ${isLoading ? 'disabled' : ''}`}
                            onClick={() => !isLoading && setRole('client')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && setRole('client')}
                            aria-pressed={role === 'client'}
                        >
                            <div className="role-card-icon">💼</div>
                            <div className="role-card-title">I am a Client</div>
                        </div>
                        <div
                            className={`role-card ${role === 'freelancer' ? 'selected' : ''} ${isLoading ? 'disabled' : ''}`}
                            onClick={() => !isLoading && setRole('freelancer')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && setRole('freelancer')}
                            aria-pressed={role === 'freelancer'}
                        >
                            <div className="role-card-icon">💻</div>
                            <div className="role-card-title">I am a Freelancer</div>
                        </div>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
                    {isLoading ? 'Signing Up...' : 'Sign Up'}
                </button>
            </form>

            <p className="auth-footer-text">
                Already have an account?{' '}
                <Link to="/login">Login</Link>
            </p>
        </AuthCard>
    );
}
