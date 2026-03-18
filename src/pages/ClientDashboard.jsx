import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import { getCurrentUser } from '../utils/auth';
import { supabase } from '../lib/supabase';

// ── Dummy data ──────────────────────────────────────────────────
const DUMMY_ACTIVITY = [
    { id: 1, dot: 'blue', text: 'Project milestone approved', time: '2 hours ago' },
    { id: 2, dot: 'green', text: 'Payment released to freelancer', time: 'Yesterday' },
    { id: 3, dot: 'purple', text: 'New freelancer matched to project', time: '3 days ago' },
];

// ── Helpers ─────────────────────────────────────────────────────
function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function getTodayDate() {
    return new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    });
}

// ── Component ────────────────────────────────────────────────────
export default function ClientDashboard() {
    const user = getCurrentUser();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = "FairLance — Client Dashboard";
        if (!user) {
            navigate('/login');
            return;
        }

        async function fetchProjects() {
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('client_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error("Error fetching projects:", error);
                } else if (data) {
                    setProjects(data);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchProjects();
    }, [user?.id, navigate]);

    return (
        <div className="dashboard-layout">
            <Sidebar />

            <main className="dashboard-main">
                {/* Top bar */}
                <div className="topbar">
                    <div>
                        <h1 className="topbar-greeting">
                            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
                        </h1>
                        <p className="topbar-date">{getTodayDate()}</p>
                    </div>
                </div>

                {/* Stats row */}
                <div className="stats-grid">
                    <StatCard icon="📁" title="Total Projects" value={projects.length.toString()} />
                    <StatCard icon="🏁" title="Active Milestones" value="0" />
                    <StatCard icon="💳" title="Pending Payments" value="₹0" />
                    <StatCard icon="✅" title="Completed Projects" value="0" />
                </div>

                {/* Active Projects */}
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">Active Projects</h2>
                        <Link to="/post-project" className="btn btn-primary btn-sm">
                            + Post a Project
                        </Link>
                    </div>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center">
                            <div className="loading-spinner"></div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-4">Syncing with ledger...</p>
                        </div>
                    ) : projects.length > 0 ? (
                        <div className="cards-grid">
                            {projects.map((p) => (
                                <Link to={`/project/${p.id}`} key={p.id} className="block no-underline">
                                    <div className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition">
                                        <h3 className="font-bold text-lg text-gray-800">{p.title}</h3>
                                        <p className="text-sm text-gray-500 mb-2 truncate">{p.description}</p>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${p.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {p.status}
                                            </span>
                                            <span className="font-bold text-gray-700 font-mono">₹{p.budget?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <span className="empty-state-icon">📂</span>
                            <h3 className="empty-state-title">No Projects Found</h3>
                            <p className="text-sm text-gray-500 mb-6">You haven't posted any projects yet. Start by defining your scope.</p>
                            <Link to="/post-project" className="btn btn-primary btn-sm">
                                Create Your First Project
                            </Link>
                        </div>
                    )}
                </section>

                {/* Recent Activity */}
                <section className="section">
                    <h2 className="section-title">Recent Activity</h2>
                    <div className="activity-list">
                        {DUMMY_ACTIVITY.map((item) => (
                            <div key={item.id} className="activity-item">
                                <span className={`activity-dot activity-dot--${item.dot}`} />
                                <div className="activity-body">
                                    <p className="activity-text">{item.text}</p>
                                    <p className="activity-time">{item.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
