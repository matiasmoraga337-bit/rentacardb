import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Car, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './AuthContext';

const loginSchema = z.object({
  email: z.string().email('Email inválido.'),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const rawFrom = (location.state as { from?: string } | null)?.from;
  const from = typeof rawFrom === 'string' && rawFrom.startsWith('/') ? rawFrom : undefined;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (usuario) return <Navigate to={from ?? '/panel'} replace />;

  const onSubmit = async (data: LoginForm): Promise<void> => {
    try {
      await login(data.email, data.password);
      navigate(from ?? '/panel');
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'No se pudo iniciar sesión.',
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
            Tu próximo viaje
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
            Gestiona tus reservas y encuentra tu próximo auto.
          </h1>
          <p className="mt-4 text-sm leading-6 text-teal-100">
            Disponibilidad real, proveedores de distintas regiones y tus reservas en un solo
            lugar.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-x-6 gap-y-2 text-xs text-teal-100">
          <span>Disponibilidad real</span>
          <span>Reserva online</span>
          <span>Soporte por chat</span>
        </div>
      </aside>

      <main className="flex min-h-[100dvh] items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-sm">
              <Car className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight">RentaCarDB</span>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Inicia sesión
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Accede a tus reservas, favoritos y conversaciones.
            </p>
          </div>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                  placeholder="tu@email.cl"
                  className="h-11 pl-9"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Contraseña</Label>
                <Link to="/recuperar" className="text-xs font-medium text-brand hover:underline">
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <Input
                  id="password"
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
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

            {errors.root && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {errors.root.message}
              </p>
            )}

            <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <Link
              to="/catalogo"
              className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver al catálogo
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
