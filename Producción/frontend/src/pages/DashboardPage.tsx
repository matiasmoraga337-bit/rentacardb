import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/AuthContext';
import { PanelAdmin } from '@/features/paneles/PanelAdmin';
import { PanelCliente } from '@/features/paneles/PanelCliente';
import { PanelProveedor } from '@/features/paneles/PanelProveedor';

export function DashboardPage() {
  const { usuario } = useAuth();
  const roles = usuario?.roles ?? [];
  const esAdmin = roles.includes('ADMIN');
  const esProveedor = roles.includes('PROVEEDOR') || roles.includes('OPERADOR');
  const esCliente = roles.includes('CLIENTE');
  const sinPanel = !esAdmin && !esProveedor && !esCliente;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Panel</h1>
        <p className="text-slate-600">Bienvenido/a, {usuario?.nombres ?? 'usuario'}.</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sesion activa</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-700">
          <p>
            <span className="font-medium">Email:</span> {usuario?.email}
          </p>
          <p>
            <span className="font-medium">Roles:</span> {roles.join(', ') || '—'}
          </p>
          <p>
            <span className="font-medium">Email verificado:</span>{' '}
            {usuario?.emailConfirmado ? 'Si' : 'No'}
          </p>
        </CardContent>
      </Card>

      {esAdmin && <PanelAdmin />}
      {esProveedor && <PanelProveedor />}
      {esCliente && <PanelCliente />}
      {sinPanel && (
        <Card>
          <CardHeader>
            <CardTitle>Sin panel asignado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">
            Tu cuenta no tiene un rol con panel disponible. Contacta a un administrador.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
