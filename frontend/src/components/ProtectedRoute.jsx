import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';

export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="screen-center"><div className="spinner" /><p>Loading your workspace…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  if (!adminOnly && user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Outlet />;
}
