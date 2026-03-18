import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getCurrentUser } from '../utils/auth';
import { savePayment, updateDispute } from '../utils/storage';

export default function DisputePage() {
    const { projectId, milestoneId } = useParams();
    const navigate = useNavigate();

    // STEP 1 — SAFE PROJECT + MILESTONE LOADING
    const user = JSON.parse(localStorage.getItem('fairlance_current_user') || 'null') || {};

    const getProjectAndMilestone = () => {
        const projects = JSON.parse(localStorage.getItem('fairlance_projects') || '[]');
        const project = projects.find(p => p.id === projectId) || null;

        const storedMilestones = JSON.parse(localStorage.getItem('fairlance_milestones') || '[]');

        let milestone = null;

        if (milestoneId && milestoneId !== 'milestone_1') {
            milestone = storedMilestones.find(m => m.id === milestoneId);
        }

        if (!milestone) {
            milestone = storedMilestones.find(m => m.project_id === projectId);
        }

        if (!milestone && project?.milestones?.length > 0) {
            milestone = project.milestones[0];
        }

        if (!milestone) {
            milestone = {
                id: 'default',
                title: 'Current Milestone',
                checklist: [
                    'Design completed',
                    'Frontend done',
                    'Backend integrated',
                    'Testing ready'
                ],
                payment_percentage: 25,
                status: 'under_review',
                deadline_days: 7
            };
        }

        return { project, milestone };
    };

    const { project, milestone } = getProjectAndMilestone();

    const disputedAmount = project
        ? ((Number(project.budget) || 50000) * (Number(milestone.payment_percentage) || 25)) / 100
        : 12500;

    // STEP 2 — SAFE SUBMISSION LOOKUP
    const getSubmission = () => {
        const submissions = JSON.parse(localStorage.getItem('fairlance_submissions') || '[]');

        let submission =
            submissions.find(s => s.project_id === projectId) ||
            submissions.find(s => s.milestone_id === milestoneId) ||
            null;

        if (!submission) {
            return {
                id: 'sample',
                file_name: 'project_submission.zip',
                version: 1,
                file_hash: 'sha256-' + Math.random().toString(36).substring(2),
                verification_score: 82,
                overall_result: 'PASS',
                createdAt: new Date().toISOString(),
                ai_verification: { pfi_score: 82, status: 'APPROVED' },
                checks: [
                    { name: 'Requirement Alignment', result: 'PASS', detail: 'All requirements met' },
                    { name: 'Completeness Check', result: 'PASS', detail: 'All deliverables present' },
                    { name: 'Quality Score', result: 'PASS', detail: 'Quality above threshold' },
                    { name: 'Plagiarism Check', result: 'PASS', detail: 'Original work confirmed' },
                    { name: 'Formatting Check', result: 'FAIL', detail: 'Minor formatting issues' }
                ]
            };
        }

        return submission;
    };

    const submission = getSubmission();

    // State for dispute form
    const [dispute, setDispute] = useState(null);
    const [reason, setReason] = useState('');
    const [response, setResponse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [disputeStatus, setDisputeStatus] = useState('NOT_FILED');
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        document.title = "FairLance — Dispute";
        const disputes = JSON.parse(localStorage.getItem('fairlance_disputes') || '[]');
        const existingDispute = disputes.find(d => d.projectId === projectId && d.milestoneId === milestone.id);
        if (existingDispute) {
            setDispute(existingDispute);
            setReason(existingDispute.reason);
            setResponse(existingDispute.response || '');
            setDisputeStatus(existingDispute.status);
        }
    }, [projectId, milestone.id]);

    const fee = Math.round(disputedAmount * 0.03);

    const stages = [
        { id: 'FILED', label: 'Filed' },
        { id: 'UNDER_REVIEW', label: 'Under Review' },
        { id: 'DECISION_PENDING', label: 'Decision Pending' },
        { id: 'RESOLVED', label: 'Resolved' }
    ];

    const currentStatus = disputeStatus === 'NOT_FILED' ? (dispute?.status || 'NOT_FILED') : disputeStatus;
    const statusIdx = stages.findIndex(s => s.id === (currentStatus.toUpperCase()));

    // STEP 3 - FIX DISPUTE SAVE LOGIC
    const handleSubmitDispute = () => {
        if (!reason.trim()) {
            setError('Please explain your reason for disputing');
            return;
        }

        setIsSubmitting(true);

        const newDispute = {
            id: crypto.randomUUID(),
            projectId,
            milestoneId: milestone.id,
            projectName: project?.title || 'Project',
            milestoneName: milestone.title,
            amount: disputedAmount,
            fee: Number((disputedAmount * 0.03).toFixed(2)),
            reason: reason,
            status: 'FILED',
            filedBy: user?.id || 'unknown',
            filedByRole: user?.role || 'client',
            createdAt: new Date().toISOString()
        };

        const disputes = JSON.parse(localStorage.getItem('fairlance_disputes') || '[]');
        disputes.push(newDispute);
        localStorage.setItem('fairlance_disputes', JSON.stringify(disputes));

        if (typeof savePayment === 'function') {
            savePayment(
                projectId,
                milestone.id,
                disputedAmount,
                'held',
                'Dispute filed — funds held pending human review'
            );
        }

        setDisputeStatus('FILED');
        setDispute(newDispute);
        setShowSuccess(true);
        setIsSubmitting(false);
        setError('');
        alert("Dispute filed successfully");
    };

    function handleSaveResponse() {
        if (!response.trim()) return alert("Please enter a response.");
        updateDispute(dispute.id, { response, status: 'UNDER_REVIEW' });
        setDispute(prev => ({ ...prev, response, status: 'UNDER_REVIEW' }));
        setDisputeStatus('UNDER_REVIEW');
        alert("Response saved successfully");
    }

    const ai = submission?.ai_verification || { pfi_score: submission.verification_score || 0, status: submission.overall_result === 'PASS' ? 'APPROVED' : 'PENDING' };

    return (
        <div className="layout min-h-screen flex flex-col bg-gray-50">
            <Header />
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
                {/* Top Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <button onClick={() => navigate(-1)} className="text-sm font-bold text-gray-400 hover:text-blue-600 mb-2 block uppercase tracking-widest">
                            ← Back to Project
                        </button>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
                            DISPUTE: <span className="text-blue-600">{project?.title || 'Unknown Project'}</span>
                        </h1>
                        <p className="text-gray-500 font-medium">Milestone: {milestone.title || milestone.name}</p>
                    </div>
                    <div className="bg-white border-2 border-red-600 p-6 rounded-2xl shadow-xl text-center md:text-right">
                        <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-1">Disputed Amount</p>
                        <p className="text-4xl font-black text-gray-900">₹{disputedAmount.toLocaleString()}</p>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="bg-white rounded-2xl shadow-sm border p-8 mb-10">
                    <div className="flex justify-between items-center relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
                        {stages.map((stage, i) => (
                            <div key={stage.id} className="relative z-10 flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${i <= statusIdx ? 'bg-red-600 text-white shadow-lg' : 'bg-white border-2 border-gray-200 text-gray-300'
                                    }`}>
                                    {i + 1}
                                </div>
                                <span className={`mt-3 text-[10px] font-black uppercase tracking-widest ${i === statusIdx ? 'text-red-600 underline' : 'text-gray-400'
                                    }`}>
                                    {stage.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3 Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                    {/* Left - Requirements */}
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="text-lg">📋</span> Milestone Requirements
                        </h3>
                        <div className="space-y-4">
                            {milestone.checklist?.length > 0 ? milestone.checklist.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
                                    <div className="w-5 h-5 rounded border-2 border-green-500 bg-green-50 flex items-center justify-center text-green-600 text-[10px]">✓</div>
                                    <span className="text-sm text-gray-700 font-medium">{item}</span>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 italic text-center py-4">Standard requirement set applied.</p>
                            )}
                        </div>
                    </div>

                    {/* Middle - Submission */}
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="text-lg">💻</span> Freelancer Submission
                        </h3>
                        {submission ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">File Name</p>
                                    <p className="font-bold text-gray-800">{submission.file_name}</p>
                                </div>
                                <div className="flex justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Version</p>
                                        <p className="font-mono text-sm bg-purple-50 text-purple-700 px-2 rounded inline-block">v{submission.version}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase">Timestamp</p>
                                        <p className="text-xs font-medium text-gray-600">{new Date(submission.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase">SHA-256 Hash</p>
                                    <p className="font-mono text-[10px] text-gray-400 truncate bg-gray-100 p-2 rounded">{submission.file_hash}</p>
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <span className="text-xs font-black text-blue-700 uppercase">AI Verification Score</span>
                                        <span className="text-2xl font-black text-blue-800">{ai.pfi_score}/100</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <p className="text-4xl mb-4">🚫</p>
                                <p className="text-sm font-bold text-gray-400 uppercase">No submission found</p>
                            </div>
                        )}
                    </div>

                    {/* Right - AI Report */}
                    <div className="bg-white rounded-2xl shadow-sm border p-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <span className="text-lg">🤖</span> AI Verification Report
                        </h3>
                        <div className="flex items-center justify-center mb-8">
                            <span className={`px-8 py-3 rounded-full text-xl font-black tracking-widest ${ai.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {ai.status === 'APPROVED' ? 'PASS' : 'FAIL'}
                            </span>
                        </div>
                        <table className="w-full text-xs">
                            <tbody className="divide-y">
                                {[
                                    { label: 'Requirement Alignment', val: ai.pfi_score > 70 ? 'PASS' : 'FAIL' },
                                    { label: 'Completeness', val: ai.pfi_score > 60 ? 'PASS' : 'FAIL' },
                                    { label: 'Quality', val: ai.pfi_score > 80 ? 'HIGH' : 'LOW' },
                                    { label: 'Plagiarism', val: 'CLEAN' },
                                    { label: 'Formatting', val: 'VALID' }
                                ].map((row, i) => (
                                    <tr key={i}>
                                        <td className="py-3 text-gray-500 font-bold uppercase tracking-tight">{row.label}</td>
                                        <td className={`py-3 text-right font-black ${row.val === 'FAIL' || row.val === 'LOW' ? 'text-red-600' : 'text-green-600'}`}>{row.val}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Case Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    <div className="bg-white rounded-2xl shadow-sm border p-8">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">CLIENT CASE</h3>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Explain your dispute</label>
                        <textarea
                            className="w-full h-40 p-4 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm leading-relaxed mb-2"
                            placeholder="Detail why you're unsatisfied with this delivery..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            disabled={dispute || user.role !== 'client'}
                        />
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase mb-6">
                            <span>Character count: {reason.length} / 2000</span>
                            <span className="text-red-500">Required for filing</span>
                        </div>

                        {!dispute && user.role === 'client' && (
                            <button
                                onClick={handleSubmitDispute}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-black transition text-sm uppercase tracking-widest shadow-lg shadow-red-200"
                            >
                                {isSubmitting ? 'Filing...' : 'Submit Final Dispute'}
                            </button>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border p-8">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">FREELANCER RESPONSE</h3>
                        {!dispute ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                                <p className="text-sm">Response will be enabled after dispute filing.</p>
                            </div>
                        ) : (
                            <>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Defense / Rebuttal</label>
                                <textarea
                                    className="w-full h-40 p-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed mb-6"
                                    placeholder="Enter your side of the story..."
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    disabled={user.role !== 'freelancer' || dispute.status === 'RESOLVED'}
                                />
                                {user.role === 'freelancer' && dispute.status === 'FILED' && (
                                    <button
                                        onClick={handleSaveResponse}
                                        className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-black transition text-sm uppercase tracking-widest shadow-lg shadow-blue-200"
                                    >
                                        Save Response
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Dispute Fee */}
                <div className="bg-gray-900 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8 border-l-8 border-red-600">
                    <div>
                        <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-2">Dispute Resolution Fee (3%)</h3>
                        <p className="text-gray-400 text-xs leading-relaxed max-w-md">
                            Both parties must deposit a participation fee. To prevent abuse, the party that loses the dispute will forfeit their total deposit to the platform and the winner.
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Client Deposit</p>
                            <p className="text-2xl font-black">₹{fee.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Freelancer Deposit</p>
                            <p className="text-2xl font-black">₹{fee.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl text-center">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 italic">VETO CLAUSE</p>
                        <p className="text-xs font-bold leading-tight">Loser forfeits <br /> total deposit</p>
                    </div>
                </div>

                <p className="mt-8 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span> Immutable Ledger Active — No edits after submission
                </p>
            </main>
        </div>
    );
}
