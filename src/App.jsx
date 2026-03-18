import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from './utils/auth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ClientDashboard from './pages/ClientDashboard';
import FreelancerDashboard from './pages/FreelancerDashboard';
import PlaceholderPage from './pages/PlaceholderPage';
import PostProjectPage from './pages/PostProjectPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import VerificationReportPage from './pages/VerificationReportPage';
import FinancialIntegrityPage from './pages/FinancialIntegrityPage';
import PfiScorePage from './pages/PfiScorePage';
import DisputePage from './pages/DisputePage';
import JudgePanel from './components/JudgePanel';

// Protected route: redirects to /login if not authenticated
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Role-based protection: redirect if wrong role
function RoleRoute({ requiredRole, children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  const user = getCurrentUser();
  if (user.role !== requiredRole) {
    return <Navigate to={user.role === 'client' ? '/client-dashboard' : '/freelancer-dashboard'} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected dashboard routes */}
        <Route
          path="/client-dashboard"
          element={
            <RoleRoute requiredRole="client">
              <ClientDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/freelancer-dashboard"
          element={
            <RoleRoute requiredRole="freelancer">
              <FreelancerDashboard />
            </RoleRoute>
          }
        />

        {/* Shared protected routes — sidebar nav links */}
        <Route path="/my-projects" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute><FinancialIntegrityPage /></ProtectedRoute>} />
        <Route path="/earnings" element={<ProtectedRoute><FinancialIntegrityPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><PlaceholderPage /></ProtectedRoute>} />

        {/* Step 4 & 5: Project Details, Verification, PFI & Payments */}
        <Route path="/project/:projectId" element={<ProtectedRoute><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/verification/:submissionId" element={<VerificationReportPage />} />
        <Route path="/pfi/:freelancerId" element={<ProtectedRoute><PfiScorePage /></ProtectedRoute>} />
        <Route path="/payments/:projectId" element={<ProtectedRoute><FinancialIntegrityPage /></ProtectedRoute>} />
        <Route path="/dispute/:projectId/:milestoneId" element={<ProtectedRoute><DisputePage /></ProtectedRoute>} />

        {/* Step 3: AI Project Posting */}
        <Route
          path="/post-project"
          element={
            <RoleRoute requiredRole="client">
              <PostProjectPage />
            </RoleRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <JudgePanel />
    </BrowserRouter>
  );
}
