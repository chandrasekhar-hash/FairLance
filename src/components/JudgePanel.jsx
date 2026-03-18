import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const LOGIC_DATA = {
    '/': {
        title: 'Platform Architecture',
        content: 'FairLance operates on 4 Pillars of Trust: Cryptographic Truth (File Hashing), AI Governance (Requirement Analysis), Financial Integrity (Smart Escrow), and Professional Fitness (PFI Score).'
    },
    '/post-project': {
        title: 'NLP Precision Engine',
        content: 'AI breaks down natural language into atomic technical requirements and automatically assigns payment weights based on development complexity vectors.'
    },
    '/project': {
        title: 'Full Stack Integrity',
        content: 'The workspace combines real-time AI scope monitoring with hashed version control for every file submission.'
    },
    '/verification': {
        title: 'Verification Logic',
        content: 'Deliverables are analyzed by Claude 3.5 Sonnet against the original milestone requirements. A pass triggers the cryptographic signal for payment release.'
    },
    '/payments': {
        title: 'Financial Integrity',
        content: 'Funds are held in a secure escrow pipeline. Logic rules ensure that only verified work or mutual agreement can trigger movement of capital.'
    },
    '/pfi': {
        title: 'Scoring Accuracy',
        content: 'The Professional Fitness Index (PFI) is a weighted mathematical average of task completion, quality scores, and delivery speed, processed via AI to eliminate human bias.'
    },
    '/dispute': {
        title: 'Dispute Resolution Logic',
        content: 'AI provides an objective audit of the work vs requirements. Cross-referencing Hashed evidence with AI sentiment ensures fair outcomes.'
    }
};

export default function JudgePanel() {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [pageData, setPageData] = useState(LOGIC_DATA['/']);

    useEffect(() => {
        const path = `/${location.pathname.split('/')[1]}`;
        setPageData(LOGIC_DATA[path] || LOGIC_DATA['/']);
    }, [location]);

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
                title="View Development Logic"
            >
                {isOpen ? (
                    <span className="text-xl">✕</span>
                ) : (
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-xs font-black leading-none mb-0.5">DEV</span>
                        <span className="text-xl leading-none">⚖️</span>
                    </div>
                )}
                {/* Tooltip hint */}
                {!isOpen && (
                    <span className="absolute right-16 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase font-bold tracking-widest">
                        Judge View: {pageData.title}
                    </span>
                )}
            </button>

            {/* Panel */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 bg-white border border-gray-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-gray-900 p-4 text-white">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-blue-400">🤖</span>
                            <h3 className="text-xs font-black uppercase tracking-widest">Antigravity Judge View</h3>
                        </div>
                        <p className="text-lg font-black tracking-tight">{pageData.title}</p>
                    </div>
                    <div className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-1.5 h-12 bg-blue-600 rounded-full flex-shrink-0"></div>
                            <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                                "{pageData.content}"
                            </p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Internal Tech Stack</p>
                            <div className="flex flex-wrap gap-2">
                                {['React', 'Supabase', 'Claude 3.5', 'CryptoJS'].map(tag => (
                                    <span key={tag} className="text-[9px] bg-white border border-blue-200 px-2 py-0.5 rounded text-blue-800 font-bold">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status: Stable</span>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-black text-blue-600 uppercase hover:underline"
                        >
                            Understood
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
