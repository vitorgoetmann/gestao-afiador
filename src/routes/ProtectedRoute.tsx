import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui/Loading';

export function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) return <Loading label="Carregando sessão" fullScreen />;
  if (!session) return <Navigate to="/login" replace />;

  return <Outlet />;
}