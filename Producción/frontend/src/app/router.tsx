import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { PerfilPage } from '@/features/auth/PerfilPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { RecuperarPage } from '@/features/auth/RecuperarPage';
import { RequireRole } from '@/features/auth/RequireRole';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { VerificarEmailPage } from '@/features/auth/VerificarEmailPage';
import { AdminProveedoresPage } from '@/features/proveedores/AdminProveedoresPage';
import { PanelProveedorPage } from '@/features/proveedores/PanelProveedorPage';
import { RegistrarProveedorPage } from '@/features/proveedores/RegistrarProveedorPage';
import { MisVehiculosPage } from '@/features/vehiculos/MisVehiculosPage';
import { VehiculoDetallePage } from '@/features/vehiculos/VehiculoDetallePage';
import { VehiculoFormPage } from '@/features/vehiculos/VehiculoFormPage';
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
      { path: 'proveedor/registro', element: <RegistrarProveedorPage /> },
      { path: 'proveedor/panel', element: <PanelProveedorPage /> },
      { path: 'proveedor/vehiculos', element: <MisVehiculosPage /> },
      { path: 'proveedor/vehiculos/nuevo', element: <VehiculoFormPage /> },
      { path: 'proveedor/vehiculos/:id', element: <VehiculoDetallePage /> },
      {
        path: 'admin/proveedores',
        element: (
          <RequireRole roles={['ADMIN']}>
            <AdminProveedoresPage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/panel" replace /> },
]);
