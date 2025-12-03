import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { Spinner } from '../ui/Spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean; // If true, only logged in users can access (Dashboard, Create)
  requireGuest?: boolean; // If true, only logged OUT users can access (Login, Signup)
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireAuth = false, 
  requireGuest = false 
}) => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // 1. If route requires auth, but user is NOT logged in -> Redirect to Login
    if (requireAuth && !session) {
      navigate('/login', { replace: true, state: { from: location } });
    }

    // 2. If route is for guests only (Login/Signup), but user IS logged in -> Redirect to Dashboard
    if (requireGuest && session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, loading, requireAuth, requireGuest, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="text-primary h-8 w-8" />
      </div>
    );
  }

  // If we are redirecting, render nothing (or a spinner) to avoid flash of content
  if ((requireAuth && !session) || (requireGuest && session)) {
    return null; 
  }

  return <>{children}</>;
};

export default AuthGuard;