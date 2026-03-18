import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import { getCurrentUser } from '../utils/auth';
import { supabase } from '../lib/supabase';

// ── Dummy data ──────────────────────────────────────────────────
const MATCHED_PROJECTS = [
    {
        id: 1,
        title: 'React Dashboard for SaaS Platform',
        budget: '₹15,000 — ₹25,000',
        deadline: 'Due in 7 days',
        matchScore: 94,
        skills: ['React', 'Node.js', 'MongoDB'],
    },
    {
        id: 2,
        title: 'E-commerce Mobile App (React Native)',
        budget: '₹30,000 — ₹50,000',
        deadline: 'Due in 14 days',
        matchScore: 88,
        skills: ['React Native', 'Firebase', 'REST APIs'],
    },
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
export default function FreelancerDashboard() {
    const user = getCurrentUser();
    const navigate = useNavigate();
    const [activeProjects, setActiveProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = "FairLance — Freelancer Dashboard";
        if (!user) {
            navigate('/login');
            return;
        }

        async function fetchProjects() {
            try {
                // For demonstration, we'll fetch all active projects the freelancer could potentially click on
                // Note: In a real app, this would filter by freelancer_id or similar assignment logic
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error("Error fetching projects:", error);
                } else if (data) {
                    setActiveProjects(data);
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
                    <StatCard icon="💰" title="Total Earned" value="₹0" />
                    <StatCard icon="📁" title="Active Projects" value={activeProjects.length.toString()} />
                    <StatCard icon="⏳" title="Pending Payments" value="₹0" />
                    <StatCard icon="⭐" title="PFI Score" value="750 / 1000" />
                </div>

                {/* AI Matched Projects */}
                <section className="section">
                    <div className="section-header">
                        <h2 className="section-title">
                            AI Matched Projects
                            <span className="section-badge">Based on your skills</span>
                        </h2>
                    </div>
                    <div className="cards-grid cards-grid--3">
                        {MATCHED_PROJECTS.map((p) => (
                            <ProjectCard key={p.id} variant="freelancer" project={p} />
                        ))}
                    </div>
                </section>

                {/* My Active Projects */}
                <section className="section">
                    <h2 className="section-title">Open Platform Projects (Demo)</h2>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center">
                            <div className="loading-spinner"></div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-4">Searching open contracts...</p>
                        </div>
                    ) : activeProjects.length > 0 ? (
                        <div className="cards-grid">
                            {activeProjects.map((p) => (
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
                            <span className="empty-state-icon">🛰️</span>
                            <h3 className="empty-state-title">No Projects Found</h3>
                            <p className="text-sm text-gray-500 mb-6">There are no open projects on the platform at the moment.</p>
                        </div>
                    )}
                </section>

                {/* Earnings Overview */}
                <section className="section">
                    <h2 className="section-title">Earnings Overview</h2>
                    <div className="earnings-card">
                        <div className="earnings-cols">
                            <div className="earnings-col">
                                <p className="earnings-label">Total Earned</p>
                                <p className="earnings-value">₹0</p>
                            </div>
                            <div className="earnings-divider" />
                            <div className="earnings-col">
                                <p className="earnings-label">Pending</p>
                                <p className="earnings-value">₹0</p>
                            </div>
                            <div className="earnings-divider" />
                            <div className="earnings-col">
                                <p className="earnings-label">Withdrawn</p>
                                <p className="earnings-value">₹0</p>
                            </div>
                        </div>
                        <button className="btn btn-ghost" disabled style={{ marginTop: '20px', opacity: 0.5, cursor: 'not-allowed' }}>
                            Withdraw
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
