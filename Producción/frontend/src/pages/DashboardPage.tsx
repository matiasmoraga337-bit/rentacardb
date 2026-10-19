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
      <p className="text-sm text-slate-500">
        Sprint S0: autenticación base. Los módulos (vehículos, reservas, pagos…) llegan en S1–S4.
      </p>
    </div>
  );
}
