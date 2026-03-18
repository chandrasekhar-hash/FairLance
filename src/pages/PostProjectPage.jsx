import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getCurrentUser } from '../utils/auth';
import { supabase } from '../lib/supabase';
import API_BASE_URL from '../utils/api';
import { savePayment, saveProject } from '../utils/storage';

const LOADING_MESSAGES = [
    'Reading your description...',
    'Extracting requirements...',
    'Generating milestones...',
    'Calculating risk score...',
    'Almost done...',
];

const SUGGESTIONS = [
    'I need a website',
    'E-commerce store with payments',
    'Mobile app for food delivery',
];

export default function PostProjectPage() {
    const navigate = useNavigate();
    const user = getCurrentUser();

    // Redirect if not client
    useEffect(() => {
        document.title = "FairLance — Post a Project";
        if (!user || user.role !== 'client') {
            navigate('/');
        }
    }, [user, navigate]);

    const [step, setStep] = useState(1);
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const [loading, setLoading] = useState(false);
    const [msgIndex, setMsgIndex] = useState(0);

    const [aiData, setAiData] = useState(null);

    const [budget, setBudget] = useState('');
    const [legalChecked, setLegalChecked] = useState(false);

    // Rotate loading messages
    useEffect(() => {
        let interval;
        if (loading) {
            interval = setInterval(() => {
                setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [loading]);

    async function handleAnalyze() {
        if (!description.trim()) {
            setError('Please enter a project description.');
            return;
        }
        setError('');
        setLoading(true);
        setMsgIndex(0);

        try {
            const res = await fetch(`${API_BASE_URL}/api/analyze-project`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description }),
            });

            const data = await res.json();
            if (res.ok) {
                setAiData(data);
                setStep(2);
            } else {
                setError(data.error || 'AI analysis failed.');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to connect to the AI server. Is it running?');
        } finally {
            setLoading(false);
        }
    }

    async function handleSaveProject() {
        if (!budget || isNaN(budget) || Number(budget) <= 0) {
            setError('Please enter a valid budget amount.');
            return;
        }

        setLoading(true);

        try {
            // Insert Project
            const { data: projectData, error: projError } = await supabase
                .from('projects')
                .insert([{
                    client_id: user.id,
                    title: aiData.detected_type || 'New Project Requirement',
                    description: description,
                    budget: Number(budget),
                    status: 'active',
                    risk_score: aiData.risk_score,
                    risk_level: aiData.risk_level,
                    nlp_data: aiData
                }])
                .select()
                .single();

            if (projError) throw projError;

            // Insert milestones mapped to the project id
            const milestonesToInsert = aiData.milestones.map(m => ({
                project_id: projectData.id,
                title: m.title,
                deliverables: m.deliverables,
                checklist: m.checklist,
                deadline_days: m.deadline_days,
                payment_percentage: m.payment_percentage,
                complexity: m.complexity,
                status: 'pending'
            }));

            const { error: milesError } = await supabase
                .from('milestones')
                .insert(milestonesToInsert);

            if (milesError) throw milesError;

            // Save project to localStorage so Financial/Dispute pages can read it
            saveProject({
                ...projectData,
                milestones: (milestonesToInsert || []).map((m, i) => ({
                    ...m,
                    id: `${projectData.id}_ms${i}`,
                }))
            });

            // Lock per-milestone payments into escrow (localStorage tracking)
            aiData.milestones.forEach((m, i) => {
                const milestoneAmount = Math.round((Number(budget) * Number(m.payment_percentage)) / 100);
                savePayment(
                    projectData.id,
                    `${projectData.id}_ms${i}`,
                    milestoneAmount,
                    'locked',
                    'Client locked project — funds secured in escrow'
                );
            });

            setStep(4); // Success screen
        } catch (err) {
            console.error('Database Error:', err);
            setError('Failed to create project in Supabase.');
        } finally {
            setLoading(false);
        }
    }

    function getCompletenessColor(score) {
        if (score > 70) return 'var(--color-success)';
        if (score >= 50) return 'var(--color-warning)';
        return 'var(--color-error)';
    }

    function getRiskBorder(level) {
        if (level === 'Low Risk') return 'var(--color-success)';
        if (level === 'High Risk') return 'var(--color-error)';
        return 'var(--color-warning)';
    }

    // Calculate percentage of budget
    function getMilestoneAmount(percentage) {
        if (!budget || isNaN(budget)) return 0;
        return Math.round((Number(budget) * percentage) / 100);
    }

    return (
        <div className="post-project-layout">
            <Header />

            {/* Loading Overlay */}
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <h2>{LOADING_MESSAGES[msgIndex]}</h2>
                </div>
            )}

            <div className="pp-container">
                {step < 4 && (
                    <div className="step-indicator">
                        <span className={step >= 1 ? 'step-active' : ''}>Step 1</span> →
                        <span className={step >= 2 ? 'step-active' : ''}>Step 2</span> →
                        <span className={step >= 3 ? 'step-active' : ''}>Step 3</span>
                    </div>
                )}

                {/* STEP 1: DESCRIPTION */}
                {step === 1 && (
                    <div className="pp-card pp-card-center">
                        <span className="badge-ai">✨ AI Feature: NLP Precision</span>
                        <h1 className="pp-title">Describe Your Project</h1>
                        <p className="pp-subtitle">Even a vague idea works. AI will structure everything.</p>

                        <textarea
                            className="pp-textarea"
                            placeholder="Example: I need a website for my restaurant"
                            value={description}
                            onChange={(e) => {
                                setDescription(e.target.value);
                                if (error) setError('');
                            }}
                            rows={6}
                        />
                        <div className="pp-char-count">{description.length} chars</div>

                        <div className="pp-suggestions">
                            {SUGGESTIONS.map(s => (
                                <button key={s} className="pp-chip" onClick={() => setDescription(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>

                        {error ? (
                            <div className="error-container" style={{ textAlign: 'center', marginTop: '1rem' }}>
                                <div className="form-error mb-4">{error}</div>
                                <button className="btn btn-primary btn-lg" onClick={handleAnalyze}>
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <button className="btn btn-primary btn-lg btn-full" onClick={handleAnalyze}>
                                Analyze Requirements
                            </button>
                        )}
                    </div>
                )}

                {/* STEP 2: AI ANALYSIS */}
                {step === 2 && aiData && (
                    <div className="analysis-grid">
                        <div className="analysis-col-left">
                            <h2 className="analysis-heading">What You Typed</h2>
                            <div className="analysis-original-text">
                                "{description}"
                            </div>
                        </div>

                        <div className="analysis-col-right">
                            <h2 className="analysis-heading">What AI Understood</h2>

                            <div className="analysis-box">
                                <h3>Detected Project Type</h3>
                                <span className="badge-type">{aiData.detected_type} ({aiData.confidence}% Confidence)</span>
                            </div>

                            <div className="analysis-box">
                                <h3>Explicit Requirements</h3>
                                <ul className="bullet-list blue">
                                    {aiData.core_requirements?.map((req, i) => (
                                        <li key={i}>{req}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="analysis-box">
                                <h3>
                                    AI Inferred Requirements
                                    <span className="badge-inferred">🤖 AI Inferred</span>
                                </h3>
                                <ul className="bullet-list purple">
                                    {aiData.implicit_requirements?.map((req, i) => (
                                        <li key={i}>{req}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="analysis-box">
                                <h3>Tech Stack</h3>
                                <div className="tech-chips">
                                    {aiData.tech_stack?.map(tech => (
                                        <span key={tech} className="tech-chip">{tech}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="analysis-box warning-box">
                                <h3>⚠️ Ambiguities Detected</h3>
                                <ul className="bullet-list">
                                    {aiData.ambiguities?.map((amb, i) => (
                                        <li key={i}>{amb}</li>
                                    ))}
                                </ul>
                            </div>

                            <div className="analysis-box">
                                <h3>Completeness Score</h3>
                                <div className="progress-bar-wrap">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${aiData.completeness_score}%`,
                                            background: getCompletenessColor(aiData.completeness_score)
                                        }}
                                    />
                                </div>
                                <p className="progress-label">{aiData.completeness_score}/100</p>
                            </div>

                            <div className="risk-card" style={{ borderLeftColor: getRiskBorder(aiData.risk_level) }}>
                                <div className="risk-header">
                                    <div className="risk-score">
                                        <span className="risk-number">{aiData.risk_score}</span>
                                        <span className="risk-max">/100</span>
                                    </div>
                                    <span className="risk-level">{aiData.risk_level}</span>
                                </div>
                                <ul className="bullet-list">
                                    {aiData.risk_reasons?.map((rs, i) => <li key={i}>{rs}</li>)}
                                </ul>
                            </div>

                            <div className="ai-milestones-section">
                                <h2 className="analysis-heading mt-8">AI Generated Milestones</h2>

                                <div className="milestones-list">
                                    {aiData.milestones?.map((m, idx) => (
                                        <div key={idx} className="milestone-card">
                                            <div className="milestone-card-header">
                                                <div className="mh-left">
                                                    <span className="m-badge">M{idx + 1}</span>
                                                    <h4 className="m-title">{m.title} <span className="m-edit-icon">✏️</span></h4>
                                                </div>
                                                <span className="badge-ai-sm">⚡ AI Generated</span>
                                            </div>

                                            <div className="m-meta">
                                                <span className="m-complexity">Complexity: {m.complexity}</span>
                                                <span className="m-confidence">Conf: {m.confidence}%</span>
                                                <span className="m-deadline">⏰ {m.deadline_days} days</span>
                                                <span className="m-payment">💰 {m.payment_percentage}%</span>
                                            </div>

                                            <div className="m-details">
                                                <strong>Deliverables:</strong>
                                                <ul className="bullet-list">
                                                    {m.deliverables?.map((del, i) => <li key={i}>{del}</li>)}
                                                </ul>
                                            </div>

                                            <div className="m-checklist">
                                                <strong>Checklist:</strong>
                                                {m.checklist?.map((chk, i) => (
                                                    <div key={i} className="chk-item">
                                                        <input type="checkbox" readOnly />
                                                        <label>{chk}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pp-actions mt-8">
                                <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
                                <button className="btn btn-primary" onClick={() => setStep(3)}>Proceed to Pricing</button>
                            </div>

                        </div>
                    </div>
                )}

                {/* STEP 3: CONFIRM */}
                {step === 3 && aiData && (
                    <div className="pp-card pp-card-center pp-card-lg">
                        <h1 className="pp-title">Review and Lock Your Project</h1>

                        <div className="budget-input-wrapper">
                            <label className="form-label">Total Project Budget (₹)</label>
                            <input
                                type="number"
                                className="form-input text-xl"
                                placeholder="e.g. 50000"
                                value={budget}
                                onChange={e => {
                                    setBudget(e.target.value);
                                    if (error) setError('');
                                }}
                            />
                        </div>

                        <table className="pricing-table">
                            <thead>
                                <tr>
                                    <th>Milestone</th>
                                    <th>%</th>
                                    <th className="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {aiData.milestones?.map((m, idx) => (
                                    <tr key={idx}>
                                        <td>M{idx + 1}: {m.title}</td>
                                        <td>{m.payment_percentage}%</td>
                                        <td className="text-right font-bold text-blue">
                                            ₹{getMilestoneAmount(m.payment_percentage).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="legal-check">
                            <input
                                type="checkbox"
                                id="legalCheck"
                                checked={legalChecked}
                                onChange={(e) => setLegalChecked(e.target.checked)}
                            />
                            <label htmlFor="legalCheck">
                                I confirm this milestone list covers everything required.
                            </label>
                        </div>

                        {error && <div className="form-error">{error}</div>}

                        <div className="pp-actions mt-8">
                            <button className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
                            <button
                                className="btn btn-primary btn-lg"
                                disabled={!legalChecked}
                                onClick={handleSaveProject}
                            >
                                Confirm & Create Project
                            </button>
                        </div>
                    </div>
                )}

                {/* STEP 4: SUCCESS */}
                {step === 4 && (
                    <div className="pp-card pp-card-center text-center">
                        <div className="success-anim">🎉</div>
                        <h1 className="pp-title mt-4">Project Created Successfully</h1>
                        <p className="pp-subtitle">AI has matched freelancers for this project.</p>

                        <div className="pp-actions mt-8" style={{ justifyContent: 'center' }}>
                            <button className="btn btn-outline" onClick={() => navigate('/client-dashboard')}>
                                Go to Dashboard
                            </button>
                            <button className="btn btn-primary">
                                View Matched Freelancers
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
