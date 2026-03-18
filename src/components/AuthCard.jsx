export default function AuthCard({ children }) {
    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-card-logo">FairLance</div>
                {children}
            </div>
        </div>
    );
}
