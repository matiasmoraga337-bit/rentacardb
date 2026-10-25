import { lazy } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { RootLayout } from '@/app/RootLayout';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { RecuperarPage } from '@/features/auth/RecuperarPage';
import { RequireRole } from '@/features/auth/RequireRole';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { VerificarEmailPage } from '@/features/auth/VerificarEmailPage';
import { CatalogoPage } from '@/features/vehiculos/CatalogoPage';
import { VehiculoPublicoPage } from '@/features/vehiculos/VehiculoPublicoPage';
import { DashboardPage } from '@/pages/DashboardPage';

const AdminAuditoriaPage = lazy(() =>
  import('@/features/admin/AdminAuditoriaPage').then((mod) => ({
    default: mod.AdminAuditoriaPage,
  })),
);
const AdminCatalogosPage = lazy(() =>
  import('@/features/admin/AdminCatalogosPage').then((mod) => ({
    default: mod.AdminCatalogosPage,
  })),
);
const AdminOutboxPage = lazy(() =>
  import('@/features/admin/AdminOutboxPage').then((mod) => ({
    default: mod.AdminOutboxPage,
  })),
);
const ReporteIngresosPage = lazy(() =>
  import('@/features/admin/ReporteIngresosPage').then((mod) => ({
    default: mod.ReporteIngresosPage,
  })),
);
const ArriendoDetallePage = lazy(() =>
  import('@/features/arriendos/ArriendoDetallePage').then((mod) => ({
    default: mod.ArriendoDetallePage,
  })),
);
const ArriendosProveedorPage = lazy(() =>
  import('@/features/arriendos/ArriendosPage').then((mod) => ({
    default: mod.ArriendosProveedorPage,
  })),
);
const MisArriendosPage = lazy(() =>
  import('@/features/arriendos/ArriendosPage').then((mod) => ({
    default: mod.MisArriendosPage,
  })),
);
const IniciarArriendoPage = lazy(() =>
  import('@/features/arriendos/IniciarArriendoPage').then((mod) => ({
    default: mod.IniciarArriendoPage,
  })),
);
const PerfilPage = lazy(() =>
  import('@/features/auth/PerfilPage').then((mod) => ({ default: mod.PerfilPage })),
);
const ChatPage = lazy(() =>
  import('@/features/chat/ChatPage').then((mod) => ({ default: mod.ChatPage })),
);
const BusquedasPage = lazy(() =>
  import('@/features/favoritos/BusquedasPage').then((mod) => ({
    default: mod.BusquedasPage,
  })),
);
const FavoritosPage = lazy(() =>
  import('@/features/favoritos/FavoritosPage').then((mod) => ({
    default: mod.FavoritosPage,
  })),
);
const AdminDisputasPage = lazy(() =>
  import('@/features/disputas/DisputasPage').then((mod) => ({
    default: mod.AdminDisputasPage,
  })),
);
const DisputasPage = lazy(() =>
  import('@/features/disputas/DisputasPage').then((mod) => ({ default: mod.DisputasPage })),
);
const AdminLiquidacionesPage = lazy(() =>
  import('@/features/liquidaciones/AdminLiquidacionesPage').then((mod) => ({
    default: mod.AdminLiquidacionesPage,
  })),
);
const ProveedorLiquidacionesPage = lazy(() =>
  import('@/features/liquidaciones/ProveedorLiquidacionesPage').then((mod) => ({
    default: mod.ProveedorLiquidacionesPage,
  })),
);
const NotificacionesPage = lazy(() =>
  import('@/features/notificaciones/NotificacionesPage').then((mod) => ({
    default: mod.NotificacionesPage,
  })),
);
const PagoPage = lazy(() =>
  import('@/features/pagos/PagoPage').then((mod) => ({ default: mod.PagoPage })),
);
const WebPayConfirmPage = lazy(() =>
  import('@/features/pagos/WebPayConfirmPage').then((mod) => ({
    default: mod.WebPayConfirmPage,
  })),
);
const AdminProveedoresPage = lazy(() =>
  import('@/features/proveedores/AdminProveedoresPage').then((mod) => ({
    default: mod.AdminProveedoresPage,
  })),
);
const PanelProveedorPage = lazy(() =>
  import('@/features/proveedores/PanelProveedorPage').then((mod) => ({
    default: mod.PanelProveedorPage,
  })),
);
const RegistrarProveedorPage = lazy(() =>
  import('@/features/proveedores/RegistrarProveedorPage').then((mod) => ({
    default: mod.RegistrarProveedorPage,
  })),
);
const CheckoutPage = lazy(() =>
  import('@/features/reservas/CheckoutPage').then((mod) => ({
    default: mod.CheckoutPage,
  })),
);
const MisReservasPage = lazy(() =>
  import('@/features/reservas/ReservasPage').then((mod) => ({
    default: mod.MisReservasPage,
  })),
);
const ReservasProveedorPage = lazy(() =>
  import('@/features/reservas/ReservasPage').then((mod) => ({
    default: mod.ReservasProveedorPage,
  })),
);
const ReservaDetallePage = lazy(() =>
  import('@/features/reservas/ReservaDetallePage').then((mod) => ({
    default: mod.ReservaDetallePage,
  })),
);
const MisVehiculosPage = lazy(() =>
  import('@/features/vehiculos/MisVehiculosPage').then((mod) => ({
    default: mod.MisVehiculosPage,
  })),
);
const VehiculoDetallePage = lazy(() =>
  import('@/features/vehiculos/VehiculoDetallePage').then((mod) => ({
    default: mod.VehiculoDetallePage,
  })),
);
const VehiculoFormPage = lazy(() =>
  import('@/features/vehiculos/VehiculoFormPage').then((mod) => ({
    default: mod.VehiculoFormPage,
  })),
);

const prototypeRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: 'prototypes/catalogo',
        lazy: async () => {
          const mod = await import('@/features/prototypes/CatalogoPrototypesPage');
          return { Component: mod.CatalogoPrototypesPage };
        },
      },
    ]
  : [];

const appRoutes: RouteObject[] = [
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
      { path: 'disputas', element: <DisputasPage /> },
      { path: 'notificaciones', element: <NotificacionesPage /> },
      { path: 'favoritos', element: <FavoritosPage /> },
      { path: 'busquedas', element: <BusquedasPage /> },
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
        path: 'proveedor/liquidaciones',
        element: (
          <RequireRole roles={['PROVEEDOR', 'OPERADOR']}>
            <ProveedorLiquidacionesPage />
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
      {
        path: 'admin/catalogos',
        element: (
          <RequireRole roles={['ADMIN']}>
            <AdminCatalogosPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/auditoria',
        element: (
          <RequireRole roles={['ADMIN']}>
            <AdminAuditoriaPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/disputas',
        element: (
          <RequireRole roles={['ADMIN']}>
            <AdminDisputasPage />
          </RequireRole>
        ),
      },
      {
        path: 'admin/liquidaciones',
        element: (
          <RequireRole roles={['ADMIN']}>
            <AdminLiquidacionesPage />
          </RequireRole>
        ),
      },
      ...prototypeRoutes,
      {
        path: 'admin/outbox',
        element: (
          <RequireRole roles={['ADMIN']}>
            <AdminOutboxPage />
          </RequireRole>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/panel" replace /> },
];

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: appRoutes,
  },
]);
