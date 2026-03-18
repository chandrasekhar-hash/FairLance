import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import { login } from '../utils/auth';

export default function LoginPage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "FairLance — Login";
    }, []);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email.trim() || !password.trim()) {
            setError('Please fill in all fields.');
            setIsLoading(false);
            return;
        }

        try {
            const user = await login(email.trim(), password);
            if (user.role === 'client') {
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
            <h2 className="auth-card-title">Welcome back</h2>
            <p className="auth-card-subtitle">Sign in to your FairLance account</p>

            <form onSubmit={handleSubmit}>
                {error && <div className="form-error">{error}</div>}

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
                        placeholder="Your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
                    {isLoading ? 'Logging In...' : 'Login'}
                </button>
            </form>

            <p className="auth-footer-text">
                Don&rsquo;t have an account?{' '}
                <Link to="/signup">Sign Up</Link>
            </p>
        </AuthCard>
    );
}
