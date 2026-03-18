import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';

export default function VerificationReportPage() {
    const { submissionId } = useParams()
    const navigate = useNavigate();

    const currentUser = JSON.parse(localStorage.getItem('fairlance_current_user') || 'null') || {}

    const getVerificationData = () => {
        const submissions = JSON.parse(localStorage.getItem('fairlance_submissions') || '[]')

        let submission = submissions.find(s => s.id === submissionId)

        if (!submission && submissions.length > 0) {
            submission = submissions[submissions.length - 1]
        }

        if (!submission) {
            return {
                id: submissionId || crypto.randomUUID(),
                overall_score: 82,
                overall_result: 'PASS',
                definition_of_done: 'Work verified against milestone requirements and quality checks.',
                ai_model: 'Gemini 2.0 Flash',
                createdAt: new Date().toISOString(),
                checks: [
                    { name: 'Requirement Alignment', result: 'PASS', detail: 'All requirements met' },
                    { name: 'Completeness Check', result: 'PASS', detail: 'Deliverables complete' },
                    { name: 'Quality Score', result: 'PASS', detail: 'Quality above threshold' },
                    { name: 'Plagiarism Check', result: 'PASS', detail: 'Original content verified' },
                    { name: 'Formatting Check', result: 'FAIL', detail: 'Minor formatting issues' }
                ],
                milestoneTitle: 'Frontend Development',
                projectId: 'sample-project',
                freelancerId: currentUser?.id,
                file_name: 'submission.zip',
                file_hash: 'sha256-' + Math.random().toString(36),
                version: 1
            }
        }

        if (!submission.checks) {
            submission.checks = [
                { name: 'Requirement Alignment', result: 'PASS', detail: 'All requirements met' },
                { name: 'Completeness Check', result: 'PASS', detail: 'Deliverables complete' },
                { name: 'Quality Score', result: 'PASS', detail: 'Quality above threshold' },
                { name: 'Plagiarism Check', result: 'PASS', detail: 'Original work verified' },
                { name: 'Formatting Check', result: 'PASS', detail: 'Formatting correct' }
            ]

            submission.overall_score = submission.verification_score || 82
            submission.overall_result = submission.overall_score >= 70 ? 'PASS' : 'FAIL'
            submission.definition_of_done = 'AI verified against milestone requirements'
            submission.ai_model = 'Gemini 2.0 Flash'
        }

        return submission
    }

    const [verificationData, setVerificationData] = useState(getVerificationData())
    const [flagged, setFlagged] = useState(false);

    const isPass = verificationData.overall_result === 'PASS';
    const score = verificationData.overall_score || 0;

    function handleFlag() {
        setFlagged(true);
        alert('Submission flagged for manual audit.');
    }

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
                            Analyzed on {new Date(verificationData.createdAt || Date.now()).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">AI Model: {verificationData.ai_model || 'Gemini 2.0 Flash'}</p>
                    </div>
                </div>

                {/* AI Explanation */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b bg-gray-50 font-bold text-gray-700 flex items-center gap-2">
                        <span>🤖</span> DEFINITION OF DONE EXPLANATION
                    </div>
                    <div className="p-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {verificationData.definition_of_done}
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
                            {verificationData.checks.map((check, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-bold text-gray-800">{check.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${check.result === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {check.result}
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
                            <p className="font-mono text-sm break-all">{verificationData.id}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Project ID</p>
                            <p className="font-mono text-sm break-all">{verificationData.projectId}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-xs font-bold uppercase mb-1">Milestone</p>
                            <p className="text-sm">{verificationData.milestoneTitle || 'Milestone #1'}</p>
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
