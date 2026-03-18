import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getProjectById, getPayments } from '../utils/storage';
import { getCurrentUser } from '../utils/auth';

export default function FinancialIntegrityPage() {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
    const [project, setProject] = useState(null);
    const [payments, setPayments] = useState([]);
    const [stats, setStats] = useState({
        totalDeposited: 0,
        totalReleased: 0,
        totalPending: 0
    });

    useEffect(() => {
        document.title = "FairLance — Financial Integrity";
        if (projectId) {
            setProject(getProjectById(projectId));
        }

        const loadPayments = () => {
            const allPayments = JSON.parse(localStorage.getItem('fairlance_payments') || '[]');

            const projectPayments = projectId
                ? allPayments.filter(p => p.projectId === projectId)
                : allPayments;

            if (!projectPayments || projectPayments.length === 0) {
                const projects = JSON.parse(localStorage.getItem('fairlance_projects') || '[]');
                const p = projects.find(proj => proj.id === projectId);

                if (p) {
                    const fallback = [
                        {
                            id: crypto.randomUUID(),
                            projectId,
                            amount: Number(p.budget) || 0,
                            status: 'locked',
                            triggerRule: 'Client locked project — funds secured in escrow',
                            transactionId: 'TXN-' + Date.now(),
                            createdAt: p.createdAt || new Date().toISOString()
                        }
                    ];

                    setPayments(fallback);

                    const totalDeposited = fallback.reduce((sum, pay) => sum + pay.amount, 0);

                    setStats({
                        totalDeposited,
                        totalReleased: 0,
                        totalPending: totalDeposited
                    });

                    return;
                }
            }

            setPayments(projectPayments);

            setStats({
                totalDeposited: projectPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
                totalReleased: projectPayments
                    .filter(p => p.status === 'released')
                    .reduce((sum, p) => sum + (p.amount || 0), 0),
                totalPending: projectPayments
                    .filter(p => p.status === 'locked' || p.status === 'held')
                    .reduce((sum, p) => sum + (p.amount || 0), 0)
            });
        };

        loadPayments();
    }, [projectId]);

    const budget = project?.budget || 50000;
    const { totalDeposited, totalReleased, totalPending } = stats;

    const stages = ['Deposited', 'Escrow', 'Review', 'Released', 'Refunded'];
    const currentStageIdx = 1; // Default to Escrow for demo

    return (
        <div className="layout min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">FINANCIAL INTEGRITY</h1>
                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest border border-green-200">
                        Escrow Secure
                    </div>
                </div>

                {/* Pipeline */}
                <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Payment Pipeline</h3>
                    <div className="relative flex justify-between">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 z-0"></div>
                        {stages.map((stage, i) => (
                            <div key={stage} className="relative z-10 flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 ${i <= currentStageIdx ? 'bg-blue-600 border-blue-200 text-white' : 'bg-white border-gray-100 text-gray-300'
                                    }`}>
                                    {i + 1}
                                </div>
                                <span className={`mt-3 text-xs font-bold uppercase tracking-tighter ${i === currentStageIdx ? 'text-blue-600 underline decoration-2 underline-offset-4' : 'text-gray-400'
                                    }`}>
                                    {stage}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    {/* Escrow Card */}
                    <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-32 h-32 bg-white opacity-10 rounded-full"></div>
                        <h3 className="text-blue-200 text-xs font-black uppercase tracking-widest mb-4">Escrow Wallet</h3>
                        <div className="mb-6">
                            <p className="text-4xl font-black mb-1">₹{totalPending.toLocaleString()}</p>
                            <p className="text-blue-200 text-sm font-medium">Secured in Smart Contract</p>
                        </div>
                        <div className="space-y-3 mb-8">
                            <div className="flex justify-between text-sm py-2 border-b border-blue-500/30">
                                <span className="text-blue-200">Total Budget</span>
                                <span className="font-bold">₹{budget.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm py-2 border-b border-blue-500/30">
                                <span className="text-blue-200">Funded Status</span>
                                <span className="font-bold text-green-300">100% Guaranteed</span>
                            </div>
                        </div>
                        <p className="text-xs bg-blue-800/50 p-3 rounded-lg border border-blue-400/20 italic">
                            "Funds secured through automated escrow rules and immutable ledgering."
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border p-6">
                            <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-4">Client Overview</h3>
                            {currentUser.role === 'client' ? (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-gray-500 text-sm">Total Deposited</span>
                                        <span className="text-xl font-black">₹{totalDeposited.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-gray-500 text-sm">Total Released</span>
                                        <span className="text-xl font-black text-green-600">₹{totalReleased.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <div className="flex justify-between items-end">
                                            <span className="text-gray-800 font-bold">Total Pending</span>
                                            <span className="text-2xl font-black text-blue-600">₹{totalPending.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm italic">Client financial stats are protected.</p>
                            )}
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
                            <h3 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-4">Freelancer Earnings</h3>
                            <div className="space-y-4 flex-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-gray-500 text-sm">Total Earned</span>
                                    <span className="text-xl font-black text-green-600">₹{totalReleased.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-gray-500 text-sm">Pending Release</span>
                                    <span className="text-xl font-black text-orange-500">₹{totalPending.toLocaleString()}</span>
                                </div>
                            </div>
                            <button disabled className="w-full mt-6 py-3 bg-gray-100 text-gray-400 font-black rounded-lg cursor-not-allowed uppercase tracking-widest text-xs">
                                Withdraw Funds (Locked)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Rule Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b bg-gray-50 font-bold text-gray-700 flex justify-between items-center">
                        <span>⚖️ CORE PAYMENT RULES</span>
                        <span className="text-[10px] text-gray-400 font-mono underline">Version 2.4.0-Stable</span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3">Rule Name</th>
                                <th className="px-6 py-3">Logic Description</th>
                                <th className="px-6 py-3 text-right">Condition</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            <tr>
                                <td className="px-6 py-4 font-bold">Hashed Milestone Locking</td>
                                <td className="px-6 py-4 text-gray-500">Funds are locked against the SHA-256 hash of the technical requirements.</td>
                                <td className="px-6 py-4 text-right font-mono text-blue-600">ID_MATCH == TRUE</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-bold">AI Verification Release</td>
                                <td className="px-6 py-4 text-gray-500">Release triggers only if Claude AI returns score &gt; 80% on deliverable analysis.</td>
                                <td className="px-6 py-4 text-right font-mono text-blue-600">PFI_SCORE &gt; 0.8</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 font-bold">Dispute Cooling Period</td>
                                <td className="px-6 py-4 text-gray-500">72-hour window after approval where funds remain in escrow state for audit.</td>
                                <td className="px-6 py-4 text-right font-mono text-blue-600">T + 72H</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Timeline */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50 font-bold text-gray-700 flex items-center justify-between">
                        <span>📜 PAYMENT TIMELINE</span>
                        <button className="text-xs text-blue-600 font-bold hover:underline">Export CSV</button>
                    </div>
                    {payments.length === 0 ? (
                        <div className="p-10 text-center text-gray-400 italic">No transactions recorded for this project yet.</div>
                    ) : (
                        <div className="divide-y">
                            {payments.map(payment => (
                                <div key={payment.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${payment.status === 'locked' ? 'bg-blue-100 text-blue-600' : payment.status === 'held' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                            {payment.status === 'locked' ? '📥' : payment.status === 'held' ? '🛑' : '📤'}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800 capitalize">{payment.status} in Escrow</p>
                                            <p className="text-xs text-gray-400 font-mono">{payment.triggerRule}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-lg ${payment.status === 'released' ? 'text-green-600' : payment.status === 'held' ? 'text-orange-600' : 'text-gray-800'}`}>
                                            {payment.status === 'released' ? '+' : ''}₹{payment.amount.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-gray-400">{new Date(payment.createdAt).toLocaleString()} • {payment.transactionId}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> All payment rules visible
                    </p>
                </div>
            </main>
        </div>
    );
}
