import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useStore from './store/useStore';
import { ToastContainer } from './components/ui/Toast';
import { RequireAuth } from './components/auth/RequireAuth';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AgentLayout from './pages/agent/AgentLayout';
import AgentWorkspace from './pages/agent/AgentWorkspace';
import CallLogsTab from './pages/agent/CallLogsTab';
import AdminLayout from './pages/admin/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import CampaignsPage from './pages/admin/CampaignsPage';
import CampaignDetailPage from './pages/admin/CampaignDetailPage';
import CallLogsPage from './pages/admin/CallLogsPage';
import AgentsPage from './pages/admin/AgentsPage';
import SettingsPage from './pages/admin/SettingsPage';
import PhoneNumbersPage from './pages/admin/PhoneNumbersPage';
import DialerCallLogsPage from './pages/admin/DialerCallLogsPage';

function App() {
  const { initTheme } = useStore();

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <Router>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected: Agent */}
        <Route path="/agent" element={
          <RequireAuth>
            <AgentLayout />
          </RequireAuth>
        }>
          <Route index element={<AgentWorkspace />} />
          <Route path="logs" element={<CallLogsTab />} />
        </Route>

        {/* Protected: Admin */}
        <Route path="/admin" element={
          <RequireAuth adminOnly={true}>
            <AdminLayout />
          </RequireAuth>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="campaigns/:id" element={<CampaignDetailPage />} />
          <Route path="call-logs" element={<CallLogsPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="phone-numbers" element={<PhoneNumbersPage />} />
          <Route path="dialer-call-logs" element={<DialerCallLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
