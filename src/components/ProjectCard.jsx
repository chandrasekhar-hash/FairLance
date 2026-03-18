// ProjectCard supports two variants:
// variant="client"      → shows milestone, status, deadline, progress bar, View button
// variant="freelancer"  → shows budget, deadline, match score, skill tags, Apply button

export default function ProjectCard({ variant = 'client', project }) {
    if (variant === 'freelancer') {
        return (
            <div className="project-card project-card--freelancer">
                <div className="project-card-header">
                    <h3 className="project-card-title">{project.title}</h3>
                    <span className="match-badge">{project.matchScore}% Match</span>
                </div>
                <div className="project-card-meta">
                    <span className="project-card-budget">💰 {project.budget}</span>
                    <span className="project-card-deadline">📅 {project.deadline}</span>
                </div>
                <div className="project-card-skills">
                    {project.skills.map((skill) => (
                        <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                </div>
                <button className="btn btn-primary project-card-btn">Apply Now</button>
            </div>
        );
    }

    // Default: client variant
    return (
        <div className="project-card project-card--client">
            <div className="project-card-header">
                <h3 className="project-card-title">{project.title}</h3>
                <span className={`status-dot status-dot--${project.statusColor}`}>
                    {project.status}
                </span>
            </div>
            <div className="project-card-meta">
                <span className="milestone-badge">🏁 {project.milestone}</span>
                <span className="project-card-deadline">⏰ {project.deadline}</span>
            </div>
            <div className="progress-bar-wrap">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${project.progress}%` }}
                />
            </div>
            <p className="progress-label">{project.progress}% complete</p>
            <button className="btn btn-outline project-card-btn">View Project</button>
        </div>
    );
}
