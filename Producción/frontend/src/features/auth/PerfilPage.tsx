import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { useCatalogo } from '@/features/catalogos/hooks';
import { formatearFecha } from '@/features/reservas/format';
import { actualizarPerfil, fetchLicencia, fetchPerfil, registrarLicencia } from './api';

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
  const clases = useCatalogo('clases-licencia');
  const licenciaQuery = useQuery({ queryKey: ['licencia'], queryFn: fetchLicencia });
  const [idClase, setIdClase] = useState<number | undefined>();
  const [numeroLicencia, setNumeroLicencia] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [licenciaMensaje, setLicenciaMensaje] = useState('');
  const [licenciaError, setLicenciaError] = useState('');
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

  const onSubmitLicencia = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLicenciaMensaje('');
    setLicenciaError('');
    if (!idClase) {
      setLicenciaError('Selecciona una clase de licencia.');
      return;
    }
    try {
      await registrarLicencia({
        ID_clase_licencia: idClase,
        numero_licencia: numeroLicencia,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento,
      });
      await queryClient.invalidateQueries({ queryKey: ['licencia'] });
      setLicenciaMensaje('Licencia registrada.');
      showToast('Licencia registrada.');
      setNumeroLicencia('');
      setFechaEmision('');
      setFechaVencimiento('');
    } catch (err) {
      setLicenciaError(err instanceof Error ? err.message : 'No se pudo registrar la licencia.');
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

      <Card>
        <CardHeader>
          <CardTitle>Licencia de conducir</CardTitle>
          <CardDescription>Registra o renueva tu licencia para arrendar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {licenciaQuery.isLoading && <p className="text-sm text-slate-500">Cargando licencia…</p>}
          {licenciaQuery.isError && (
            <p className="text-sm text-red-600">No se pudo cargar la licencia.</p>
          )}
          {licenciaQuery.data && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-medium">
                Clase {licenciaQuery.data.clase} · {licenciaQuery.data.numero}
              </p>
              <p className="mt-1 text-slate-600">
                Vence {formatearFecha(licenciaQuery.data.fechaVencimiento)} ·{' '}
                {licenciaQuery.data.verificada ? 'Verificada' : 'Pendiente de verificacion'}
              </p>
            </div>
          )}
          {!licenciaQuery.data && !licenciaQuery.isLoading && (
            <p className="text-sm text-slate-500">Sin licencia registrada.</p>
          )}

          <form className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2" onSubmit={onSubmitLicencia}>
            <div className="space-y-1">
              <Label htmlFor="claseLicencia">Clase</Label>
              <Select
                id="claseLicencia"
                value={idClase ?? ''}
                onChange={(event) =>
                  setIdClase(event.target.value ? Number(event.target.value) : undefined)
                }
                required
              >
                <option value="">Selecciona una clase</option>
                {clases.data?.map((clase) => (
                  <option key={clase.id} value={clase.id}>
                    {clase.nombre}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="numeroLicencia">Numero</Label>
              <Input
                id="numeroLicencia"
                value={numeroLicencia}
                maxLength={20}
                onChange={(event) => setNumeroLicencia(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fechaEmision">Emision</Label>
              <Input
                id="fechaEmision"
                type="date"
                value={fechaEmision}
                onChange={(event) => setFechaEmision(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fechaVencimiento">Vencimiento</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={fechaVencimiento}
                onChange={(event) => setFechaVencimiento(event.target.value)}
                required
              />
            </div>
            {licenciaMensaje && (
              <p className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-700 sm:col-span-2">
                {licenciaMensaje}
              </p>
            )}
            {licenciaError && (
              <p className="rounded-md bg-red-50 p-2 text-sm text-red-700 sm:col-span-2">
                {licenciaError}
              </p>
            )}
            <div className="sm:col-span-2">
              <Button type="submit">Registrar licencia</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
