import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ReporteIngresosPage } from '@/features/admin/ReporteIngresosPage';
import { ArriendoDetallePage } from '@/features/arriendos/ArriendoDetallePage';
import { ArriendosProveedorPage, MisArriendosPage } from '@/features/arriendos/ArriendosPage';
import { IniciarArriendoPage } from '@/features/arriendos/IniciarArriendoPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { PerfilPage } from '@/features/auth/PerfilPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { RecuperarPage } from '@/features/auth/RecuperarPage';
import { RequireRole } from '@/features/auth/RequireRole';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { VerificarEmailPage } from '@/features/auth/VerificarEmailPage';
import { ChatPage } from '@/features/chat/ChatPage';
import { PagoPage } from '@/features/pagos/PagoPage';
import { WebPayConfirmPage } from '@/features/pagos/WebPayConfirmPage';
import { AdminProveedoresPage } from '@/features/proveedores/AdminProveedoresPage';
import { PanelProveedorPage } from '@/features/proveedores/PanelProveedorPage';
import { RegistrarProveedorPage } from '@/features/proveedores/RegistrarProveedorPage';
import { CheckoutPage } from '@/features/reservas/CheckoutPage';
import { MisReservasPage, ReservasProveedorPage } from '@/features/reservas/ReservasPage';
import { ReservaDetallePage } from '@/features/reservas/ReservaDetallePage';
import { MisVehiculosPage } from '@/features/vehiculos/MisVehiculosPage';
import { CatalogoPage } from '@/features/vehiculos/CatalogoPage';
import { VehiculoDetallePage } from '@/features/vehiculos/VehiculoDetallePage';
import { VehiculoFormPage } from '@/features/vehiculos/VehiculoFormPage';
import { VehiculoPublicoPage } from '@/features/vehiculos/VehiculoPublicoPage';
import { DashboardPage } from '@/pages/DashboardPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/recuperar', element: <RecuperarPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/verificar-email', element: <VerificarEmailPage /> },
  { path: '/catalogo', element: <CatalogoPage /> },
  { path: '/catalogo/:id', element: <VehiculoPublicoPage /> },
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
      {
        path: 'reservas',
        element: (
          <RequireRole roles={['CLIENTE']}>
            <MisReservasPage />
          </RequireRole>
        ),
      },
      {
        path: 'checkout/:vehiculoId',
        element: (
          <RequireRole roles={['CLIENTE']}>
            <CheckoutPage />
          </RequireRole>
        ),
      },
      {
        path: 'reservas/:id/pagar',
        element: (
          <RequireRole roles={['CLIENTE']}>
            <PagoPage />
          </RequireRole>
        ),
      },
      {
        path: 'webpay/confirmar',
        element: (
          <RequireRole roles={['CLIENTE']}>
            <WebPayConfirmPage />
          </RequireRole>
        ),
      },
      { path: 'reservas/:id', element: <ReservaDetallePage /> },
      {
        path: 'arriendos',
        element: (
          <RequireRole roles={['CLIENTE']}>
            <MisArriendosPage />
          </RequireRole>
        ),
      },
      { path: 'arriendos/:id', element: <ArriendoDetallePage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'chat/:id', element: <ChatPage /> },
      { path: 'proveedor/registro', element: <RegistrarProveedorPage /> },
      {
        path: 'proveedor/panel',
        element: (
          <RequireRole roles={['PROVEEDOR', 'OPERADOR', 'ADMIN']}>
            <PanelProveedorPage />
          </RequireRole>
        ),
      },
      {
        path: 'proveedor/arriendos/iniciar/:reservaId',
        element: (
          <RequireRole roles={['PROVEEDOR', 'OPERADOR', 'ADMIN']}>
            <IniciarArriendoPage />
          </RequireRole>
        ),
      },
      {
        path: 'proveedor/arriendos',
        element: (
          <RequireRole roles={['PROVEEDOR', 'OPERADOR', 'ADMIN']}>
            <ArriendosProveedorPage />
          </RequireRole>
        ),
      },
      {
        path: 'proveedor/reservas',
        element: (
          <RequireRole roles={['PROVEEDOR', 'OPERADOR', 'ADMIN']}>
            <ReservasProveedorPage />
          </RequireRole>
        ),
      },
      {
        path: 'proveedor/vehiculos',
        element: (
          <RequireRole roles={['PROVEEDOR', 'OPERADOR', 'ADMIN']}>
            <MisVehiculosPage />
          </RequireRole>
        ),
      },
      {
        path: 'proveedor/vehiculos/nuevo',
        element: (
          <RequireRole roles={['PROVEEDOR', 'OPERADOR', 'ADMIN']}>
            <VehiculoFormPage />
          </RequireRole>
        ),
      },
      {
        path: 'proveedor/vehiculos/:id',
        element: (
          <RequireRole roles={['PROVEEDOR', 'OPERADOR', 'ADMIN']}>
            <VehiculoDetallePage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/proveedores',
        element: (
          <RequireRole roles={['ADMIN']}>
            <AdminProveedoresPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/reportes',
        element: (
          <RequireRole roles={['ADMIN']}>
            <ReporteIngresosPage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/panel" replace /> },
]);
