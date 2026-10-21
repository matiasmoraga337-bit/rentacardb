import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { registrarProveedor } from './api';

const schema = z
  .object({
    tipo: z.enum(['PERSONA', 'EMPRESA']),
    nombreComercial: z.string().min(1, 'Nombre comercial obligatorio.'),
    razonSocial: z.string().optional(),
    rutProveedor: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email('Email invalido.').optional().or(z.literal('')),
  })
  .refine((data) => data.tipo !== 'EMPRESA' || Boolean(data.razonSocial && data.rutProveedor), {
    message: 'Empresa requiere razon social y RUT.',
    path: ['razonSocial'],
  });

type FormData = z.infer<typeof schema>;

export function RegistrarProveedorPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { tipo: 'PERSONA' } });

  const tipo = watch('tipo');

  const onSubmit = async (data: FormData): Promise<void> => {
    try {
      await registrarProveedor({
        tipo: data.tipo,
        nombreComercial: data.nombreComercial,
        razonSocial: data.razonSocial,
        rutProveedor: data.rutProveedor,
        telefono: data.telefono,
        email: data.email || undefined,
      });
      navigate('/proveedor/panel');
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'No se pudo registrar.' });
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">Registrarme como proveedor</h1>
      <Card>
        <CardHeader>
          <CardTitle>Datos del proveedor</CardTitle>
          <CardDescription>Quedara PENDIENTE hasta que un administrador lo apruebe.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select id="tipo" {...register('tipo')}>
                <option value="PERSONA">Persona</option>
                <option value="EMPRESA">Empresa</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreComercial">Nombre comercial</Label>
              <Input id="nombreComercial" {...register('nombreComercial')} />
              {errors.nombreComercial && (
                <p className="text-sm text-red-600">{errors.nombreComercial.message}</p>
              )}
            </div>
            {tipo === 'EMPRESA' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="razonSocial">Razon social</Label>
                  <Input id="razonSocial" {...register('razonSocial')} />
                  {errors.razonSocial && (
                    <p className="text-sm text-red-600">{errors.razonSocial.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rutProveedor">RUT empresa</Label>
                  <Input id="rutProveedor" {...register('rutProveedor')} />
                </div>
              </>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telefono">Telefono</Label>
                <Input id="telefono" {...register('telefono')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>
            {errors.root && (
              <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{errors.root.message}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando…' : 'Registrar proveedor'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
