import { Car, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from './AuthContext';

export function WorkspaceModeModal() {
  const { usuario, modoActivo, setModoActivo } = useAuth();
  const navigate = useNavigate();
  const roles = usuario?.roles ?? [];
  const tieneCliente = roles.includes('CLIENTE');
  const tieneProveedor = roles.includes('PROVEEDOR');

  if (!usuario || modoActivo || !tieneCliente || !tieneProveedor) return null;

  const entrar = (modo: 'CLIENTE' | 'PROVEEDOR'): void => {
    setModoActivo(modo);
    navigate(modo === 'CLIENTE' ? '/panel' : '/proveedor/panel');
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modo-title">
      <Card className="w-full max-w-xl border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Tu cuenta tiene dos roles</p>
          <CardTitle id="modo-title" className="text-2xl">¿Cómo quieres entrar?</CardTitle>
          <CardDescription>Puedes cambiar de modo más tarde desde el menú lateral.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => entrar('CLIENTE')} className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-brand hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <Car className="h-6 w-6 text-brand" aria-hidden="true" />
            <strong className="mt-3 block text-base text-slate-900">Entrar como cliente</strong>
            <span className="mt-1 block text-sm leading-5 text-slate-500">Busca, reserva y gestiona tus alquileres.</span>
          </button>
          <button type="button" onClick={() => entrar('PROVEEDOR')} className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-brand hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <Building2 className="h-6 w-6 text-brand" aria-hidden="true" />
            <strong className="mt-3 block text-base text-slate-900">Entrar como proveedor</strong>
            <span className="mt-1 block text-sm leading-5 text-slate-500">Publica y administra tu flota, sedes y reservas.</span>
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
