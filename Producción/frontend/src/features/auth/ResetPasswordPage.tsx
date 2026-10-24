import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { confirmarReset } from './api';

const schema = z
  .object({
    password: z.string().min(8, 'Minimo 8 caracteres.'),
    confirmar: z.string().min(8, 'Minimo 8 caracteres.'),
  })
  .refine((data) => data.password === data.confirmar, {
    message: 'Las contrasenas no coinciden.',
    path: ['confirmar'],
  });

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData): Promise<void> => {
    try {
      await confirmarReset(token, data.password);
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la contrasena.');
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Nueva contrasena</CardTitle>
          <CardDescription>Ingresa una contrasena segura.</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <p className="text-sm text-red-600">Falta el token de recuperacion.</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar">Confirmar contrasena</Label>
                <Input id="confirmar" type="password" autoComplete="new-password" {...register('confirmar')} />
                {errors.confirmar && <p className="text-sm text-red-600">{errors.confirmar.message}</p>}
              </div>
              {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando…' : 'Actualizar contrasena'}
              </Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="text-brand hover:underline">
              Volver al inicio de sesion
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
