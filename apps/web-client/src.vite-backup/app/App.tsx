/**
 * App Component - SSR-compatible
 * Moved to app/ directory for better organization
 */

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import SubjectsPage from '../pages/SubjectsPage';
import SubjectDetailPage from '../pages/SubjectDetailPage';
import CalendarPage from '../pages/CalendarPage';
import LoginPage from '../pages/LoginPage';
import ProfilePage from '../pages/ProfilePage';
import type { Profile, AuthUser } from '@medical-portal/shared';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, initializeFromServer } = useAuthStore();

  useEffect(() => {
    // Initialize auth state on mount (client-side only)
    if (typeof window !== 'undefined') {
      initializeFromServer();
    }
  }, [initializeFromServer]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

interface AppProps {
  ssrAuth?: {
    user: AuthUser | null;
    profile: Profile | null;
    isAuthenticated: boolean;
  };
}

function App({ ssrAuth }: AppProps) {
  // Initialize auth store with SSR data if available
  useEffect(() => {
    if (ssrAuth && ssrAuth.isAuthenticated) {
      const store = useAuthStore.getState();
      // Only set if not already initialized
      if (!store.isInitialized) {
        store.setAuth(ssrAuth.user!, ssrAuth.profile!, '');
      }
    }
  }, [ssrAuth]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="subjects/:id" element={<SubjectDetailPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
