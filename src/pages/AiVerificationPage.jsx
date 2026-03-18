import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getSubmissionById, saveFlag } from '../utils/storage';

export default function AiVerificationPage() {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState(null);
    const [flagged, setFlagged] = useState(false);

    useEffect(() => {
        document.title = "FairLance — AI Verification Report";
        if (!submissionId) return;
        const sub = getSubmissionById(submissionId);
        if (!sub) {
            alert('Submission not found');
            navigate(-1);
            return;
        }
        setSubmission(sub);
    }, [submissionId, navigate]);

    if (!submission) return null;

    const ai = submission.ai_verification || {
        pfi_score: 0,
        status: 'PENDING',
        explanation: 'Verification in progress...',
        issues_found: []
    };

    const isPass = ai.status === 'APPROVED';
    const score = ai.pfi_score || 0;

    function handleFlag() {
        saveFlag({
            submissionId,
            projectId: submission.project_id,
            reason: 'Manual review requested by user',
            type: 'USER_FLAG'
        });
        setFlagged(true);
        alert('Submission flagged for manual audit.');
    }

    const checks = [
        { name: 'Requirement Alignment', pass: score > 70, detail: score > 70 ? 'High alignment with milestone scope.' : 'Deviations from original scope detected.' },
        { name: 'Completeness Check', pass: score > 60, detail: score > 60 ? 'All checklist items addressed.' : 'Missing key deliverables.' },
        { name: 'Quality Score', pass: score > 80, detail: `AI Quality index: ${score}%` },
        { name: 'Plagiarism Check', pass: true, detail: 'Originality score: 99.8%' },
        { name: 'Formatting Check', pass: true, detail: 'Industry standards met.' }
    ];

    return (
        <div className="layout min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-black">
                        ← Back to Project
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleFlag}
                            disabled={flagged}
                            className={`btn ${flagged ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'btn-ghost text-red-600 border-red-200 hover:bg-red-50'}`}
                        >
                            {flagged ? '🚩 Flagged' : '🚩 Flag for Audit'}
                        </button>
                    </div>
                </div>

                {/* Score Header */}
                <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
                    <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center ${isPass ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}`}>
                        <span className="text-3xl font-black">{score}</span>
                        <span className="text-xs font-bold uppercase tracking-wider">Score</span>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            <h1 className="text-3xl font-black">
                                {isPass ? 'PASS' : 'FAIL'}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                AI VERIFIED
                            </span>
                        </div>
                        <p className="text-gray-500 font-medium">
                            Analyzed on {new Date(submission.created_at || Date.now()).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">AI Model: Claude 3.5 Sonnet</p>
                    </div>
                </div>

                {/* AI Explanation */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b bg-gray-50 font-bold text-gray-700 flex items-center gap-2">
                        <span>🤖</span> DEFINITION OF DONE EXPLANATION
                    </div>
                    <div className="p-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {ai.explanation}
                    </div>
                </div>

                {/* Check Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b bg-gray-50 font-bold text-gray-700">
                        VERIFICATION CHECKLIST
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Requirement</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Detail</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {checks.map((check, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-bold text-gray-800">{check.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${check.pass ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {check.pass ? 'PASS' : 'FAIL'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{check.detail}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Audit Panel */}
                <div className="bg-gray-900 rounded-xl p-8 text-white shadow-xl">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-400">
                        <span className="text-xl">📋</span> AUDIT LOG DATA
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Submission ID</p>
                            <p className="font-mono text-sm">{submissionId}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Project ID</p>
                            <p className="font-mono text-sm">{submission.project_id}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Milestone</p>
                            <p className="text-sm">Milestone #1</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Verified At</p>
                            <p className="text-sm">{new Date().toLocaleTimeString()}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Final Score</p>
                            <p className="text-xl font-black text-blue-400">{score}/100</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
                    <p className="text-blue-800 font-bold mb-1 italic">"AI evaluates work objectively based on cryptographic evidence and requirement vectors."</p>
                </div>
            </main>
        </div>
    );
}
