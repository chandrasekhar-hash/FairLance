import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getCurrentUser } from '../utils/auth';
import { supabase } from '../lib/supabase';
import API_BASE_URL, { fetchWithTimeout } from '../utils/api';
import { saveProject, saveSubmission } from '../utils/storage';

export default function ProjectDetailPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const user = getCurrentUser();

    const [project, setProject] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [submissions, setSubmissions] = useState([]);

    // File Upload State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadPreview, setUploadPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        document.title = project ? `FairLance — ${project.title}` : "FairLance — Project Detail";
        if (!user) {
            navigate('/login');
            return;
        }

        async function fetchProjectData() {
            try {
                // Fetch project and its milestones
                const { data: projData, error: projError } = await supabase
                    .from('projects')
                    .select('*, milestones(*)')
                    .eq('id', projectId)
                    .single();

                if (projError || !projData) {
                    setError('Project not found or access denied.');
                    return;
                }
                setProject(projData);

                // Fetch chat messages
                const { data: msgData, error: msgError } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: true });

                if (!msgError && msgData) {
                    setMessages(msgData);
                }

                // Fetch submissions
                const { data: subData, error: subError } = await supabase
                    .from('submissions')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: false });

                if (!subError && subData) {
                    setSubmissions(subData);
                }

                // Step 5: Sync with localStorage for the new screens
                // const { saveProject, saveSubmission } = await import('../utils/storage');
                saveProject(projData);
                if (subData) {
                    subData.forEach(s => saveSubmission(s));
                }

            } catch (err) {
                console.error(err);
                setError('Failed to load project details.');
            } finally {
                setLoading(false);
            }
        }

        fetchProjectData();
    }, [projectId, user?.id, navigate]);

    async function handleSendMessage(e) {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Optimistically update UI
        const tempId = 'temp_' + Date.now();
        const optimisticMsg = {
            id: tempId,
            project_id: projectId,
            sender_id: user.id,
            sender_name: user.name,
            sender_role: user.role,
            content: newMessage.trim(),
            is_scope_change: false,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');

        let isScopeChange = false;

        // Only run scope check for Client messages to simulate Escrow AI monitoring the client's asks
        if (user.role === 'client') {
            try {
                const aiRes = await fetch(`${API_BASE_URL}/api/detect-scope-creep`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: optimisticMsg.content,
                        projectDescription: project.description
                    })
                });
                if (aiRes.ok) {
                    const aiData = await aiRes.json();
                    isScopeChange = aiData.is_scope_change;
                }
            } catch (err) {
                console.error("Scope creep AI failed:", err);
            }
        }

        const messageObj = {
            project_id: projectId,
            sender_id: user.id,
            sender_name: user.name,
            sender_role: user.role,
            content: optimisticMsg.content,
            is_scope_change: isScopeChange
        };

        const { data, error } = await supabase
            .from('messages')
            .insert([messageObj])
            .select()
            .single();

        if (error) {
            console.error('Failed to send message', error);
            // Revert optimistic insert on failure
            setMessages(prev => prev.filter(m => m.id !== tempId));
        } else {
            // Replace temp message with real DB record
            setMessages(prev => prev.map(m => m.id === tempId ? data : m));
        }
    }

    // --- File Upload & Processing Logic ---
    function handleFileChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);

        // Preview if image
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (ev) => setUploadPreview(ev.target.result);
            reader.readAsDataURL(file);
        } else {
            setUploadPreview(null);
        }
    }

    async function processAndUploadFile() {
        if (!selectedFile || !project.milestones[0]) return;
        setIsUploading(true);

        try {
            // 1. Calculate SHA-256 Hash
            const buffer = await selectedFile.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // 2. Watermark if Image
            if (selectedFile.type.startsWith('image/')) {
                await applyWatermark(uploadPreview, `FAIRLANCE PROTECTED — PRJ-${projectId} — ${new Date().toISOString()}`);
            }

            // 3. Call AI Verification API
            let verificationResult = null;
            try {
                const aiRes = await fetchWithTimeout(
                    `${API_BASE_URL}/api/verify-work`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fileName: selectedFile.name,
                            milestoneTitle: project.milestones[0].title,
                            milestoneChecklist: project.milestones[0].checklist?.join('\n') || 'Deliver standard quality.'
                        })
                    },
                    30000
                );
                if (aiRes.ok) {
                    verificationResult = await aiRes.json();
                }
            } catch (err) {
                console.error("AI Verification failed", err);
            }

            // 4. Save to Supabase (simulating file storage by saving data/hash)
            const version = submissions.length + 1;
            const subObj = {
                project_id: projectId,
                freelancer_id: user.id,
                milestone_id: project.milestones[0].id,
                file_name: selectedFile.name,
                file_hash: hashHex,
                version: version,
                ai_verification: verificationResult,
                // In a real app we'd upload finalDataUrl to a bucket and save the URL here.
                // We'll skip storing huge base64 strings in the row for this prototype to prevent payload errors,
                // but the logical flow of hashing/watermarking is demonstrated above.
            };

            const { data, error } = await supabase
                .from('submissions')
                .insert([subObj])
                .select()
                .single();

            if (error) throw error;

            // Step 5: Sync with localStorage
            // const { saveSubmission } = await import('../utils/storage');
            saveSubmission(data);

            setSubmissions(prev => [data, ...prev]);

            setIsUploadModalOpen(false);
            setSelectedFile(null);
            setUploadPreview(null);
            alert("File successfully hashed, documented, and verified!");

        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed. Check console.");
        } finally {
            setIsUploading(false);
        }
    }

    function applyWatermark(base64Source, textText) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');

                // Draw original
                ctx.drawImage(img, 0, 0);

                // Draw watermark
                ctx.font = `${Math.floor(img.width / 20)}px Arial`;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Rotate and place in center
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate(-Math.PI / 4);
                ctx.fillText(textText, 0, 0);

                resolve(canvas.toDataURL('image/png'));
            };
            img.src = base64Source;
        });
    }

    if (loading) {
        return (
            <div className="layout min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Header />
                <div className="loading-spinner"></div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-4">Opening Workspace...</p>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="layout min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <Header />
                <div className="bg-white p-10 rounded-2xl shadow-xl border text-center max-w-md mx-6">
                    <span className="text-4xl mb-4 block">⚠️</span>
                    <h2 className="text-xl font-black mb-2 uppercase">Something went wrong</h2>
                    <p className="text-gray-500 text-sm mb-6">{error || "Project data is currently unavailable."}</p>
                    <button onClick={() => window.location.reload()} className="btn btn-primary w-full">Retry Connection</button>
                    <button onClick={() => navigate(-1)} className="btn btn-ghost w-full mt-2">Go Back</button>
                </div>
            </div>
        );
    }

    function getRiskColor(level) {
        if (level === 'Low Risk') return 'var(--color-success)';
        if (level === 'High Risk' || level === 'Very High Risk') return 'var(--color-error)';
        return 'var(--color-warning)';
    }

    return (
        <div className="layout flex flex-col h-screen">
            <Header />

            {/* Top Bar */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(user.role === 'client' ? '/client-dashboard' : '/freelancer-dashboard')}
                        className="text-gray-500 hover:text-black transition"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-xl font-bold">{project.title}</h1>
                    <span
                        className="px-3 py-1 text-xs font-bold rounded-full text-white"
                        style={{ backgroundColor: getRiskColor(project.risk_level) }}
                    >
                        {project.risk_level}
                    </span>
                </div>
                <div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 font-medium rounded-md text-sm uppercase">
                        {project.status}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex relative">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-gray-50">

                    {/* Milestone Tracker Placeholder */}
                    <div className="bg-white p-6 rounded-lg shadow-sm mb-6 border">
                        <h2 className="text-lg font-bold mb-4">Milestone Tracker</h2>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            {project.milestones?.map((m, idx) => (
                                <div key={m.id} className="flex flex-col items-center flex-1">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-2">
                                        {idx + 1}
                                    </div>
                                    <span className="text-center px-2">{m.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Section Placeholder */}
                    <div className="flex-1 bg-white border rounded-lg shadow-sm flex flex-col overflow-hidden min-h-[400px]">
                        <div className="px-6 py-3 border-b bg-gray-50 font-semibold flex items-center justify-between">
                            Project Chat
                            <span className="text-xs font-normal text-gray-500">Scope AI Active</span>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {messages.length === 0 ? (
                                <p className="text-center text-gray-400 text-sm mt-10">No messages yet. Start the conversation!</p>
                            ) : (
                                messages.map(msg => {
                                    const isMe = msg.sender_id === user.id;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-700">{msg.sender_name}</span>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-200 text-gray-800 rounded-tl-sm'}`}>
                                                {msg.content}
                                            </div>
                                            {msg.is_scope_change && (
                                                <div className="mt-1 bg-yellow-100 text-yellow-800 text-xs px-3 py-1.5 rounded flex items-center gap-2 max-w-[80%] border border-yellow-200">
                                                    <span>⚠️ Possible scope change detected</span>
                                                    <button className="text-blue-600 font-bold ml-auto hover:underline">Review</button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition disabled:bg-gray-300"
                                    disabled={!newMessage.trim()}
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-80 bg-white border-l p-6 overflow-y-auto shadow-sm z-10 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-4 tracking-tight">Escrow Status</h3>
                    <div
                        className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6 text-center cursor-pointer hover:bg-green-100 transition"
                        onClick={() => navigate(`/payments/${projectId}`)}
                    >
                        <span className="block text-green-700 font-bold uppercase text-xs mb-1">Funded Budget</span>
                        <span className="block text-2xl font-black text-green-800">₹{project.budget?.toLocaleString()}</span>
                        <span className="block text-[10px] text-green-600 mt-2 font-bold uppercase tracking-widest underline italic">View Rules →</span>
                    </div>

                    <h3 className="font-bold text-gray-800 mb-4 tracking-tight">Current Milestone</h3>
                    {project.milestones && project.milestones[0] ? (
                        <div className="border rounded-lg p-4 bg-blue-50 border-blue-100">
                            <h4 className="font-bold text-blue-900 leading-tight mb-2">M1: {project.milestones[0].title}</h4>
                            <div className="text-2xl font-black text-blue-700 mb-3">
                                ₹{Math.round((project.budget * project.milestones[0].payment_percentage) / 100).toLocaleString()}
                            </div>
                            <div className="text-xs text-blue-600 space-y-1">
                                <p>Deadline: {project.milestones[0].deadline_days} Days</p>
                                <p>Complexity: {project.milestones[0].complexity}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-500 italic">No milestones set.</div>
                    )}

                    <div className="mt-8 border-t pt-6 flex-1">
                        <h3 className="font-bold text-gray-800 mb-4 tracking-tight flex items-center justify-between">
                            Submissions
                            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs">{submissions.length}</span>
                        </h3>

                        {submissions.length === 0 ? (
                            <p className="text-sm text-gray-500">No files submitted yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {submissions.map(sub => (
                                    <div key={sub.id} className="border rounded-lg p-3 text-sm flex flex-col gap-2 shadow-sm relative group">
                                        <div className="flex items-center justify-between font-bold text-gray-800">
                                            <span className="truncate pr-2">{sub.file_name}</span>
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">v{sub.version}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono truncate" title={sub.file_hash}>
                                            Hash: {sub.file_hash.substring(0, 8)}...
                                        </div>
                                        {sub.ai_verification ? (
                                            <div
                                                className={`mt-2 p-2 rounded cursor-pointer transition transform hover:scale-[1.02] ${sub.ai_verification.status === 'APPROVED' ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' :
                                                    sub.ai_verification.status === 'REVISION_NEEDED' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100' :
                                                        'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                                    }`}
                                                onClick={() => navigate(`/verification/${sub.id}`)}
                                            >
                                                <div className="font-bold flex justify-between items-center mb-1">
                                                    AI Review: {sub.ai_verification.status}
                                                    <span className="text-xs text-black bg-white px-2 py-0.5 rounded-full opacity-70">
                                                        Score: {sub.ai_verification.pfi_score}/100
                                                    </span>
                                                </div>
                                                <div className="text-xs leading-tight">
                                                    {sub.ai_verification.explanation?.substring(0, 60)}...
                                                    <span className="block mt-1 font-bold underline">View Full Report →</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-xs text-blue-600 animate-pulse">
                                                AI Verification pending...
                                            </div>
                                        )}
                                        {/* Link to PFI Score for the freelancer */}
                                        <button
                                            onClick={() => navigate(`/pfi/${sub.freelancer_id}`)}
                                            className="text-[10px] mt-1 text-gray-400 font-bold uppercase tracking-widest hover:text-blue-600 self-start"
                                        >
                                            View Freelancer PFI →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload Modal Base inside flex context to cover content safely */}
                {isUploadModalOpen && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
                        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full">
                            <h2 className="text-2xl font-bold mb-4">Submit Deliverable</h2>
                            <p className="text-gray-600 mb-6">File will be cryptographically hashed and analyzed by AI against Milestone #1 requirements.</p>

                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="cursor-pointer bg-blue-50 text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-blue-100 transition inline-block mb-4"
                                >
                                    Choose File
                                </label>
                                {selectedFile && <div className="text-sm font-bold text-gray-800">{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</div>}
                            </div>

                            {uploadPreview && (
                                <div className="mb-6 border rounded overflow-hidden relative">
                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center pointer-events-none">
                                        <span className="text-white text-lg font-black tracking-widest opacity-80 rotate-[-20deg]" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                            FAIRLANCE WATERMARK PREVIEW
                                        </span>
                                    </div>
                                    <img src={uploadPreview} alt="Preview" className="w-full h-40 object-cover" />
                                </div>
                            )}

                            <div className="flex gap-4 justify-end">
                                <button
                                    onClick={() => { setIsUploadModalOpen(false); setSelectedFile(null); setUploadPreview(null); }}
                                    className="px-6 py-2 border rounded-lg text-gray-600 font-medium hover:bg-gray-50"
                                    disabled={isUploading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={processAndUploadFile}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2"
                                    disabled={!selectedFile || isUploading}
                                >
                                    {isUploading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Hashing & Verifying...
                                        </>
                                    ) : 'Complete Submission'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Bar */}
            <div className="bg-white border-t px-6 py-4 flex justify-between items-center shadow-lg z-20">
                <div className="text-sm text-gray-500 flex items-center gap-3">
                    Milestone 1 is currently
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase text-blue-700 bg-blue-100`}>
                        {submissions.length > 0 ? 'Under Review' : 'In Progress'}
                    </span>
                </div>
                <div>
                    {user.role === 'freelancer' ? (
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-2 rounded-lg transition shadow-sm"
                        >
                            Submit Deliverables
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate(`/dispute/${projectId}/milestone_1`)}
                                className="px-6 py-2 border border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-lg"
                            >
                                Raise Dispute
                            </button>
                            <button className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm" disabled={submissions.length === 0}>
                                {submissions.length > 0 ? 'Review & Approve' : 'Awaiting Submission'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
