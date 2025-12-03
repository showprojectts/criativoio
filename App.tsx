
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import CreatePage from './pages/CreatePage';
import HistoryPage from './pages/HistoryPage';
import RechargePage from './pages/RechargePage';
import PlansPage from './pages/PlansPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import SettingsLayout from './components/layouts/SettingsLayout';
import ProfilePage from './pages/settings/ProfilePage';
import SecurityPage from './pages/settings/SecurityPage';
import BillingPage from './pages/settings/BillingPage';
import AISettingsPage from './pages/settings/AISettingsPage';
import NotificationsPage from './pages/settings/NotificationsPage';
import { AuthProvider, useAuth } from './components/providers/AuthProvider';
import AuthGuard from './components/auth/AuthGuard';
import AppLayout from './components/layouts/AppLayout';
import { Spinner } from './components/ui/Spinner';

// Internal component to consume AuthContext and handle global loading state
const AppRoutes: React.FC = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-slate-50">
        <Spinner className="text-primary h-10 w-10 mb-4" />
        <p className="text-slate-400 animate-pulse font-medium">Carregando Sessão...</p>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-background text-slate-50 font-sans selection:bg-primary selection:text-white">
        <Routes>
          {/* 1. Public Routes */}
          <Route path="/" element={<LandingPage />} />
          
          {/* 2. Guest Routes (Login/Signup) */}
          <Route 
            path="/login" 
            element={
              <AuthGuard requireGuest>
                <LoginPage />
              </AuthGuard>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <AuthGuard requireGuest>
                <SignupPage />
              </AuthGuard>
            } 
          />

          {/* 3. Protected App Routes (Wrapped in Sidebar Layout) */}
          <Route element={
              <AuthGuard requireAuth>
                <AppLayout />
              </AuthGuard>
          }>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create" element={<CreatePage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/recharge" element={<RechargePage />} />
              <Route path="/pricing" element={<RechargePage />} /> {/* Alias route for sidebar/settings link */}
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              
              {/* Settings Nested Routes */}
              <Route path="/settings" element={<SettingsLayout />}>
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="security" element={<SecurityPage />} />
                  <Route path="billing" element={<BillingPage />} />
                  <Route path="ai" element={<AISettingsPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
              </Route>
          </Route>

        </Routes>
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
