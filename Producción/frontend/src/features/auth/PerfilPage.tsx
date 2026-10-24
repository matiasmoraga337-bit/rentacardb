import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { actualizarPerfil, fetchPerfil } from './api';

const schema = z.object({
  nombres: z.string().min(1, 'Nombres obligatorios.'),
  apellidoPaterno: z.string().min(1, 'Apellido paterno obligatorio.'),
  apellidoMaterno: z.string().optional(),
  telefono: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function PerfilPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading } = useQuery({ queryKey: ['perfil'], queryFn: fetchPerfil });
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (data) {
      reset({
        nombres: data.nombres,
        apellidoPaterno: data.apellidoPaterno ?? '',
        apellidoMaterno: data.apellidoMaterno ?? '',
        telefono: data.telefono ?? '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (form: FormData): Promise<void> => {
    setMensaje('');
    setError('');
    try {
      await actualizarPerfil(form);
      await queryClient.invalidateQueries({ queryKey: ['perfil'] });
      setMensaje('Perfil actualizado.');
      showToast('Perfil actualizado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el perfil.');
    }
  };

  if (isLoading) return <p className="text-slate-500">Cargando perfil…</p>;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Mi perfil</h1>
      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>{data?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="nombres">Nombres</Label>
              <Input id="nombres" {...register('nombres')} />
              {errors.nombres && <p className="text-sm text-red-600">{errors.nombres.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apellidoPaterno">Apellido paterno</Label>
                <Input id="apellidoPaterno" {...register('apellidoPaterno')} />
                {errors.apellidoPaterno && (
                  <p className="text-sm text-red-600">{errors.apellidoPaterno.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidoMaterno">Apellido materno</Label>
                <Input id="apellidoMaterno" {...register('apellidoMaterno')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Telefono</Label>
              <Input id="telefono" {...register('telefono')} />
            </div>
            {mensaje && <p className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700">{mensaje}</p>}
            {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
