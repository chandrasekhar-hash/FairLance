export default function StatCard({ icon, title, value }) {
    return (
        <div className="stat-card">
            <div className="stat-card-icon">{icon}</div>
            <div className="stat-card-body">
                <p className="stat-card-title">{title}</p>
                <p className="stat-card-value">{value}</p>
            </div>
        </div>
    );
}
