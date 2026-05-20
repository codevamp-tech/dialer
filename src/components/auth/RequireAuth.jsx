import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { Spinner } from '../ui/Spinner';

export function RequireAuth({ children, adminOnly = false }) {
  const { isAuthenticated, user, fetchProfile } = useStore();
  const [loading, setLoading] = useState(!user && isAuthenticated);

  // On hard reload: token exists but user is not in memory yet.
  // Fetch profile once to re-hydrate the user object before making role decisions.
  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchProfile().finally(() => setLoading(false));
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show a spinner while re-hydrating user from the token on reload
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  // Role check — only after user is loaded
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/agent" replace />;
  }

  return children;
}
