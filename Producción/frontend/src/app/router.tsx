import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { PerfilPage } from '@/features/auth/PerfilPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { RecuperarPage } from '@/features/auth/RecuperarPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { VerificarEmailPage } from '@/features/auth/VerificarEmailPage';
import { DashboardPage } from '@/pages/DashboardPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/recuperar', element: <RecuperarPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verificar-email', element: <VerificarEmailPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/panel" replace /> },
      { path: 'panel', element: <DashboardPage /> },
      { path: 'perfil', element: <PerfilPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/panel" replace /> },
]);
