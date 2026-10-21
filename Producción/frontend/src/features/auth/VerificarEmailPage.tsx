import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verificarEmail } from './api';

export function VerificarEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>('cargando');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!token) {
      setEstado('error');
      setMensaje('Falta el token de verificacion.');
      return;
    }
    verificarEmail(token)
      .then(() => setEstado('ok'))
      .catch((err: unknown) =>
        setMensaje(err instanceof Error ? err.message : 'No se pudo verificar el email.'),
      )
      .finally(() => setEstado((prev) => (prev === 'cargando' ? 'error' : prev)));
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Verificacion de email</CardTitle>
          <CardDescription>
            {estado === 'cargando' && 'Verificando…'}
            {estado === 'ok' && 'Tu email fue verificado correctamente.'}
            {estado === 'error' && (mensaje || 'El enlace es invalido o expiro.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => (window.location.href = '/login')}>
            Ir al inicio de sesion
          </Button>
          <p className="mt-3 text-center text-sm">
            <Link to="/login" className="text-brand hover:underline">
              Volver
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
