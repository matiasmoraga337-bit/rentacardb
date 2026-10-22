import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/AuthContext';

export function DashboardPage() {
  const { usuario } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel</h1>
        <p className="text-slate-600">Bienvenido/a, {usuario?.nombres ?? 'usuario'}.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sesión activa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-slate-700">
          <p>
            <span className="font-medium">Email:</span> {usuario?.email}
          </p>
          <p>
            <span className="font-medium">Roles:</span> {usuario?.roles.join(', ') || '—'}
          </p>
          <p>
            <span className="font-medium">Email verificado:</span>{' '}
            {usuario?.emailConfirmado ? 'Sí' : 'No'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accesos rápidos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link to="/catalogo">
            <Button variant="outline">Buscar vehículos</Button>
          </Link>
          {usuario?.roles.includes('CLIENTE') && (
            <>
              <Link to="/reservas">
                <Button variant="outline">Mis reservas</Button>
              </Link>
              <Link to="/arriendos">
                <Button variant="outline">Mis alquileres</Button>
              </Link>
            </>
          )}
          {(usuario?.roles.includes('PROVEEDOR') ||
            usuario?.roles.includes('OPERADOR') ||
            usuario?.roles.includes('ADMIN')) && (
            <>
              <Link to="/proveedor/reservas">
                <Button variant="outline">Reservas de mis vehículos</Button>
              </Link>
              <Link to="/proveedor/arriendos">
                <Button variant="outline">Arriendos</Button>
              </Link>
            </>
          )}
          {usuario?.roles.includes('ADMIN') && (
            <Link to="/admin/reportes">
              <Button variant="outline">Reporte de ingresos</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-slate-500">
        Sprint S2: reservas, disponibilidad, pagos WebPay simulado y reembolsos.
      </p>
    </div>
  );
}
