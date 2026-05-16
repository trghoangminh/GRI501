import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { AuthScreens } from './screens/AuthScreens';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { RoadmapScreen } from './screens/RoadmapScreen';
import { ChatbotScreen } from './screens/ChatbotScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { QuizScreen } from './screens/QuizScreen';
import { QuizHistoryScreen } from './screens/QuizHistoryScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { SettingsScreen } from './screens/SettingsScreen';

import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboardScreen } from './screens/admin/AdminDashboardScreen';
import { AdminUsersScreen } from './screens/admin/AdminUsersScreen';
import { AdminSettingsScreen } from './screens/admin/AdminSettingsScreen';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [isMobile, setIsMobile] = React.useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated: show auth screens
  if (!user) return <AuthScreens />;

  // Admin routing
  if (user.role === 'admin') {
    return (
      <AdminLayout isMobile={isMobile}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboardScreen />} />
          <Route path="/admin/users" element={<AdminUsersScreen />} />
          <Route path="/admin/settings" element={<AdminSettingsScreen />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </AdminLayout>
    );
  }

  // Authenticated but no learning goal: onboarding
  if (!user.learning_goal) return <OnboardingScreen />;

  // Student routing
  return (
    <MainLayout isMobile={isMobile}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/roadmap" element={<RoadmapScreen />} />
        <Route path="/chat" element={<ChatbotScreen />} />
        <Route path="/library" element={<LibraryScreen />} />
        <Route path="/quizzes" element={<QuizScreen />} />
        <Route path="/quiz-history" element={<QuizHistoryScreen />} />
        <Route path="/analytics" element={<AnalyticsScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1f2e',
              color: '#f0f4f8',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
