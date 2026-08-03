import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ClientesPage } from '@/pages/clientes/ClientesPage';
import { AfiacoesPage } from '@/pages/afiacoes/AfiacoesPage';
import { RelatoriosPage } from '@/pages/relatorios/RelatoriosPage';
import { ConfiguracoesPage } from '@/pages/configuracoes/ConfiguracoesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <AuthLayout>
        <LoginPage />
      </AuthLayout>
    ),
  },
  {
    path: '/cadastro',
    element: (
      <AuthLayout>
        <RegisterPage />
      </AuthLayout>
    ),
  },
  {
    path: '/esqueci-senha',
    element: (
      <AuthLayout>
        <ForgotPasswordPage />
      </AuthLayout>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <AuthLayout>
        <ResetPasswordPage />
      </AuthLayout>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'clientes', element: <ClientesPage /> },
          { path: 'afiacoes', element: <AfiacoesPage /> },
          { path: 'relatorios', element: <RelatoriosPage /> },
          { path: 'configuracoes', element: <ConfiguracoesPage /> },
          { index: true, element: <Navigate to="dashboard" replace /> },
        ],
      },
    ],
  },
]);