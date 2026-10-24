import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './AuthContext';
import { recuperar } from './api';

const schema = z.object({ email: z.string().email('Email invalido.') });
type FormData = z.infer<typeof schema>;

export function RecuperarPage() {
  const { usuario } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [mensaje, setMensaje] = useState('');

  const onSubmit = async (data: FormData): Promise<void> => {
    try {
      setMensaje(await recuperar(data.email));
    } catch {
      setMensaje('Si el email esta registrado, recibiras un enlace para restablecer la contrasena.');
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recuperar contrasena</CardTitle>
          <CardDescription>Te enviaremos un enlace para restablecerla.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email')} />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
            {mensaje && <p className="rounded-md bg-slate-50 p-2 text-sm text-slate-700">{mensaje}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link to={usuario ? '/panel' : '/login'} className="text-brand hover:underline">
              Volver
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
