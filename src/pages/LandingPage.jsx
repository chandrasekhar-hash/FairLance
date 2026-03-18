import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import FeatureCard from '../components/FeatureCard';

const features = [
    {
        icon: '🧠',
        title: 'NLP Precision',
        description: 'AI turns vague ideas into precise technical checklists.',
    },
    {
        icon: '✅',
        title: 'Verification Logic',
        description: 'Different verification rules for code, content, and design.',
    },
    {
        icon: '💰',
        title: 'Financial Integrity',
        description: 'Every payment has a transparent audit trail.',
    },
    {
        icon: '⭐',
        title: 'Scoring Accuracy',
        description: 'Reputation scores with full breakdown and formula.',
    },
];

export default function LandingPage() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "FairLance — AI Powered Freelancing";
    }, []);

    return (
        <div className="landing-page">
            <Header />

            {/* Hero */}
            <section className="hero-section">
                <span className="hero-badge">✦ AI Powered Freelancing</span>
                <h1 className="hero-headline">Freelancing. Fair. Automatic.</h1>
                <p className="hero-sub">
                    AI structures your project, verifies work, and releases payment automatically.
                    No disputes. No trust issues.
                </p>
                <div className="hero-actions">
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => navigate('/signup?role=client')}
                    >
                        Post a Project
                    </button>
                    <button
                        className="btn btn-outline btn-lg"
                        onClick={() => navigate('/signup?role=freelancer')}
                    >
                        Find Work
                    </button>
                </div>
            </section>

            {/* Feature Grid */}
            <section className="features-section">
                <div className="container">
                    <h2>Why FairLance?</h2>
                    <div className="features-grid">
                        {features.map((f) => (
                            <FeatureCard
                                key={f.title}
                                icon={f.icon}
                                title={f.title}
                                description={f.description}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                FairLance 2025 — AI Freelancing Platform
            </footer>
        </div>
    );
}
