const USERS_KEY = 'fairlance_users';
const PROJECTS_KEY = 'fairlance_projects';
const SUBMISSIONS_KEY = 'fairlance_submissions';
const PAYMENTS_KEY = 'fairlance_payments';
const FLAGS_KEY = 'fairlance_flags';
const DISPUTES_KEY = 'fairlance_disputes';

export function getUsers() {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export function saveUser(user) {
    const users = getUsers();
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function findUserByEmail(email) {
    const users = getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export function findUserByEmailAndPassword(email, password) {
    const users = getUsers();
    return (
        users.find(
            (u) =>
                u.email.toLowerCase() === email.toLowerCase() && u.password === password
        ) || null
    );
}

export function generateId() {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

// Project Utils
export function getProjects() {
    const data = localStorage.getItem(PROJECTS_KEY);
    if (!data) return [];
    try { return JSON.parse(data); } catch { return []; }
}

export function getProjectById(id) {
    return getProjects().find(p => p.id === id);
}

export function saveProject(project) {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) projects[index] = project;
    else projects.push(project);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

// Submission Utils
export function getSubmissions() {
    const data = localStorage.getItem(SUBMISSIONS_KEY);
    if (!data) return [];
    try { return JSON.parse(data); } catch { return []; }
}

export function getSubmissionById(id) {
    return getSubmissions().find(s => s.id === id);
}

export function saveSubmission(submission) {
    const submissions = getSubmissions();
    const index = submissions.findIndex(s => s.id === submission.id);
    if (index >= 0) submissions[index] = submission;
    else submissions.push(submission);
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
}

// Payment Utils
export function getPayments(projectId) {
    const data = localStorage.getItem(PAYMENTS_KEY);
    let payments = [];
    try { payments = data ? JSON.parse(data) : []; } catch { payments = []; }
    return projectId ? payments.filter(p => p.projectId === projectId) : payments;
}

export function savePayment(projectId, milestoneId, amount, status, triggerRule) {
    const payment = {
        id: generateId(),
        projectId,
        milestoneId: milestoneId || null,
        amount: Number(amount) || 0,
        status,
        triggerRule,
        transactionId: 'TXN-' + Date.now(),
        createdAt: new Date().toISOString()
    };
    const payments = getPayments();
    payments.push(payment);
    localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
    return payment;
}

// Flag Utils
export function getFlags() {
    const data = localStorage.getItem(FLAGS_KEY);
    if (!data) return [];
    try { return JSON.parse(data); } catch { return []; }
}

export function saveFlag(flag) {
    const flags = getFlags();
    flags.push({ ...flag, timestamp: new Date().toISOString() });
    localStorage.setItem(FLAGS_KEY, JSON.stringify(flags));
}

// Dispute Utils
export function getDisputes() {
    const data = localStorage.getItem(DISPUTES_KEY);
    if (!data) return [];
    try { return JSON.parse(data); } catch { return []; }
}

export function getDisputeByMilestone(projectId, milestoneId) {
    return getDisputes().find(d => d.projectId === projectId && d.milestoneId === milestoneId);
}

export function saveDispute(dispute) {
    const disputes = getDisputes();
    const newDispute = {
        ...dispute,
        id: generateId(),
        status: 'FILED',
        createdAt: new Date().toISOString()
    };
    disputes.push(newDispute);
    localStorage.setItem(DISPUTES_KEY, JSON.stringify(disputes));
    return newDispute;
}

export function updateDispute(id, updates) {
    const disputes = getDisputes();
    const index = disputes.findIndex(d => d.id === id);
    if (index >= 0) {
        disputes[index] = { ...disputes[index], ...updates };
        localStorage.setItem(DISPUTES_KEY, JSON.stringify(disputes));
    }
}
