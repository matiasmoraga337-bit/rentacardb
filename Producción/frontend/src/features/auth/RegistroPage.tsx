import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Car, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './AuthContext';
import { registro, type RegistroResponse } from './api';

const schema = z
  .object({
    rut: z
      .string()
      .min(3, 'RUT obligatorio.')
      .regex(/^[0-9.]{8,12}-[0-9kK]$/, 'Formato esperado: 12345678-5.'),
    nombres: z.string().min(1, 'Nombres obligatorios.'),
    apellidoPaterno: z.string().min(1, 'Apellido paterno obligatorio.'),
    apellidoMaterno: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email('Email inválido.'),
    password: z.string().min(8, 'Mínimo 8 caracteres.'),
    confirmar: z.string().min(8, 'Mínimo 8 caracteres.'),
  })
  .refine((data) => data.password === data.confirmar, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmar'],
  });

type RegistroForm = z.infer<typeof schema>;

export function RegistroPage() {
  const { usuario } = useAuth();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [resultado, setResultado] = useState<RegistroResponse | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegistroForm>({ resolver: zodResolver(schema) });

  if (usuario) return <Navigate to="/panel" replace />;

  const onSubmit = async (data: RegistroForm): Promise<void> => {
    try {
      const response = await registro({
        rut: data.rut.replace(/\./g, '').trim(),
        nombres: data.nombres.trim(),
        apellidoPaterno: data.apellidoPaterno.trim(),
        apellidoMaterno: data.apellidoMaterno?.trim() || undefined,
        telefono: data.telefono?.trim() || undefined,
        email: data.email.trim(),
        password: data.password,
      });
      setResultado(response);
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'No se pudo crear la cuenta.',
      });
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-teal-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(94,234,212,0.3),transparent_36%),radial-gradient(circle_at_85%_0%,rgba(20,184,166,0.28),transparent_40%),linear-gradient(135deg,#042f2e_0%,#115e59_55%,#0f766e_100%)]"
          aria-hidden="true"
        />
        <img
          src="/images/hero-car.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-6 -right-10 w-[520px] opacity-70"
        />

        <Link to="/catalogo" className="relative flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/20">
            <Car className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight">RentaCarDB</span>
        </Link>

        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">
            Crea tu cuenta
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
            Reserva tu próximo auto en pocos pasos.
          </h1>
          <p className="mt-4 text-sm leading-6 text-teal-100">
            Guarda tus favoritos, gestiona reservas y conversa con proveedores de todo Chile.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-x-6 gap-y-2 text-xs text-teal-100">
          <span>Disponibilidad real</span>
          <span>Reserva online</span>
          <span>Soporte por chat</span>
        </div>
      </aside>

      <main className="flex min-h-[100dvh] items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-lg">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-sm">
              <Car className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">RentaCarDB</span>
          </div>

          {resultado ? (
            <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Cuenta creada
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                Revisa tu correo
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enviamos un enlace de verificación a <strong>{resultado.usuario.email}</strong>.
                También puedes iniciar sesión y verificar tu correo más tarde.
              </p>
              {resultado.tokenVerificacion && (
                <Link
                  to={`/verificar-email?token=${resultado.tokenVerificacion}`}
                  className="mt-4 inline-flex text-sm font-medium text-brand hover:underline"
                >
                  Verificar cuenta ahora
                </Link>
              )}
              <Link to="/login" className="mt-5 block">
                <Button className="w-full">Ir a iniciar sesión</Button>
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Crea tu cuenta
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Regístrate para reservar, guardar favoritos y conversar con proveedores.
                </p>
              </div>

              <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="rut">RUT</Label>
                  <div className="relative">
                    <UserRound
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <Input
                      id="rut"
                      autoComplete="username"
                      placeholder="12345678-5"
                      className="h-11 pl-9"
                      {...register('rut')}
                    />
                  </div>
                  {errors.rut && <p className="text-sm text-red-600">{errors.rut.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombres">Nombres</Label>
                  <Input id="nombres" autoComplete="given-name" className="h-11" {...register('nombres')} />
                  {errors.nombres && (
                    <p className="text-sm text-red-600">{errors.nombres.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="apellidoPaterno">Apellido paterno</Label>
                    <Input
                      id="apellidoPaterno"
                      autoComplete="family-name"
                      className="h-11"
                      {...register('apellidoPaterno')}
                    />
                    {errors.apellidoPaterno && (
                      <p className="text-sm text-red-600">{errors.apellidoPaterno.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidoMaterno">Apellido materno</Label>
                    <Input
                      id="apellidoMaterno"
                      className="h-11"
                      {...register('apellidoMaterno')}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <div className="relative">
                      <Phone
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <Input
                        id="telefono"
                        autoComplete="tel"
                        className="h-11 pl-9"
                        {...register('telefono')}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        className="h-11 pl-9"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <LockKeyhole
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <Input
                        id="password"
                        type={mostrarPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="h-11 pl-9 pr-10"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        aria-pressed={mostrarPassword}
                        onClick={() => setMostrarPassword((visible) => !visible)}
                        className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        {mostrarPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmar">Confirmar contraseña</Label>
                    <Input
                      id="confirmar"
                      type={mostrarPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="h-11"
                      {...register('confirmar')}
                    />
                    {errors.confirmar && (
                      <p className="text-sm text-red-600">{errors.confirmar.message}</p>
                    )}
                  </div>
                </div>

                {errors.root && (
                  <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errors.root.message}
                  </p>
                )}

                <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 border-t border-slate-200 pt-5">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
