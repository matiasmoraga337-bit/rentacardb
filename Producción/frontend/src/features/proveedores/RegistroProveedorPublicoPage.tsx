import { useState } from 'react';
import { ArrowLeft, Building2, Car, Check, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useAuth } from '@/features/auth/AuthContext';
import { registrarProveedorPublico } from './api';

type Paso = 'cuenta' | 'proveedor';

export function RegistroProveedorPublicoPage() {
  const navigate = useNavigate();
  const { usuario, loginConSesion, setModoActivo } = useAuth();
  const [paso, setPaso] = useState<Paso>('cuenta');
  const [tipo, setTipo] = useState<'PERSONA' | 'EMPRESA'>('PERSONA');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cuenta, setCuenta] = useState({
    rut: '', nombres: '', apellidoPaterno: '', apellidoMaterno: '', telefono: '',
    email: '', password: '', confirmar: '',
  });
  const [proveedor, setProveedor] = useState({
    nombreComercial: '', razonSocial: '', rutProveedor: '', telefono: '', email: '',
  });

  if (usuario) {
    return <Navigate to={usuario.roles.includes('PROVEEDOR') ? '/proveedor/panel' : '/proveedor/registro'} replace />;
  }

  const setCuentaField = (key: keyof typeof cuenta, value: string): void =>
    setCuenta((current) => ({ ...current, [key]: value }));
  const setProveedorField = (key: keyof typeof proveedor, value: string): void =>
    setProveedor((current) => ({ ...current, [key]: value }));

  const continuar = (): void => {
    setError('');
    if (!cuenta.rut.trim() || !cuenta.nombres.trim() || !cuenta.apellidoPaterno.trim()) {
      setError('Completa RUT, nombres y apellido paterno.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cuenta.email)) {
      setError('Ingresa un email valido.');
      return;
    }
    if (cuenta.password.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }
    if (cuenta.password !== cuenta.confirmar) {
      setError('Las contrasenas no coinciden.');
      return;
    }
    setPaso('proveedor');
  };

  const enviar = async (): Promise<void> => {
    setError('');
    if (!proveedor.nombreComercial.trim()) {
      setError('El nombre comercial es obligatorio.');
      return;
    }
    if (tipo === 'EMPRESA' && (!proveedor.razonSocial.trim() || !proveedor.rutProveedor.trim())) {
      setError('Para empresa, razon social y RUT son obligatorios.');
      return;
    }
    setEnviando(true);
    try {
      const response = await registrarProveedorPublico({
        cuenta: {
          rut: cuenta.rut.replace(/\./g, '').trim(),
          nombres: cuenta.nombres.trim(),
          apellidoPaterno: cuenta.apellidoPaterno.trim(),
          apellidoMaterno: cuenta.apellidoMaterno.trim() || undefined,
          telefono: cuenta.telefono.trim() || undefined,
          email: cuenta.email.trim(),
          password: cuenta.password,
        },
        proveedor: {
          tipo,
          nombreComercial: proveedor.nombreComercial.trim(),
          razonSocial: proveedor.razonSocial.trim() || undefined,
          rutProveedor: proveedor.rutProveedor.trim() || undefined,
          telefono: proveedor.telefono.trim() || undefined,
          email: proveedor.email.trim() || undefined,
        },
      });
      loginConSesion({ token: response.token, usuario: response.usuario });
      setModoActivo('PROVEEDOR');
      navigate('/proveedor/panel');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el proveedor.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al catalogo
        </Link>
        <div className="mt-7 flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white">
            <Car className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">RentaCarDB</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Publica tu flota</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Crea una cuenta de proveedor. Podras usar la misma cuenta para reservar como cliente o gestionar tus vehiculos como proveedor.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm">
          <span className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${paso === 'cuenta' ? 'bg-brand text-white' : 'bg-emerald-100 text-emerald-800'}`}>
            {paso === 'proveedor' ? <Check className="h-4 w-4" aria-hidden="true" /> : '1'} Cuenta
          </span>
          <span className="h-px flex-1 bg-slate-200" />
          <span className={`rounded-full px-3 py-1.5 ${paso === 'proveedor' ? 'bg-brand text-white' : 'bg-slate-100 text-slate-500'}`}>2 Proveedor</span>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>{paso === 'cuenta' ? 'Datos de tu cuenta' : 'Datos del proveedor'}</CardTitle>
            <CardDescription>
              {paso === 'cuenta'
                ? 'Usaras este email y contrasena para entrar a RentaCarDB.'
                : 'Tu proveedor quedara pendiente hasta que un administrador lo apruebe.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paso === 'cuenta' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="publicoRut">RUT</Label>
                  <div className="relative"><UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input id="publicoRut" value={cuenta.rut} onChange={(e) => setCuentaField('rut', e.target.value)} className="h-11 pl-9" placeholder="12345678-5" /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="publicoNombres">Nombres</Label><Input id="publicoNombres" value={cuenta.nombres} onChange={(e) => setCuentaField('nombres', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="publicoApellido">Apellido paterno</Label><Input id="publicoApellido" value={cuenta.apellidoPaterno} onChange={(e) => setCuentaField('apellidoPaterno', e.target.value)} /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="publicoApellidoMaterno">Apellido materno</Label><Input id="publicoApellidoMaterno" value={cuenta.apellidoMaterno} onChange={(e) => setCuentaField('apellidoMaterno', e.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="publicoTelefono">Telefono</Label><Input id="publicoTelefono" value={cuenta.telefono} onChange={(e) => setCuentaField('telefono', e.target.value)} /></div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publicoEmail">Email</Label>
                  <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input id="publicoEmail" type="email" value={cuenta.email} onChange={(e) => setCuentaField('email', e.target.value)} className="h-11 pl-9" /></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="publicoPassword">Contrasena</Label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input id="publicoPassword" type="password" value={cuenta.password} onChange={(e) => setCuentaField('password', e.target.value)} className="h-11 pl-9" /></div></div>
                  <div className="space-y-2"><Label htmlFor="publicoConfirmar">Confirmar contrasena</Label><Input id="publicoConfirmar" type="password" value={cuenta.confirmar} onChange={(e) => setCuentaField('confirmar', e.target.value)} className="h-11" /></div>
                </div>
                {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm text-slate-500">Ya tienes cuenta? <Link to="/login" className="font-medium text-brand hover:underline">Inicia sesion</Link></span><Button type="button" onClick={continuar}>Continuar <span aria-hidden="true">→</span></Button></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="publicoTipo">Tipo de proveedor</Label><Select id="publicoTipo" value={tipo} onChange={(e) => setTipo(e.target.value as 'PERSONA' | 'EMPRESA')}><option value="PERSONA">Persona</option><option value="EMPRESA">Empresa</option></Select></div>
                <div className="space-y-2"><Label htmlFor="publicoNombreComercial">Nombre comercial</Label><Input id="publicoNombreComercial" value={proveedor.nombreComercial} onChange={(e) => setProveedorField('nombreComercial', e.target.value)} /></div>
                {tipo === 'EMPRESA' && <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="publicoRazon">Razon social</Label><Input id="publicoRazon" value={proveedor.razonSocial} onChange={(e) => setProveedorField('razonSocial', e.target.value)} /></div><div className="space-y-2"><Label htmlFor="publicoRutEmpresa">RUT empresa</Label><Input id="publicoRutEmpresa" value={proveedor.rutProveedor} onChange={(e) => setProveedorField('rutProveedor', e.target.value)} /></div></div>}
                <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="publicoTelefonoComercial">Telefono comercial</Label><Input id="publicoTelefonoComercial" value={proveedor.telefono} onChange={(e) => setProveedorField('telefono', e.target.value)} /></div><div className="space-y-2"><Label htmlFor="publicoEmailComercial">Email comercial</Label><Input id="publicoEmailComercial" type="email" value={proveedor.email} onChange={(e) => setProveedorField('email', e.target.value)} /></div></div>
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900"><Building2 className="mr-2 inline h-4 w-4" aria-hidden="true" />Tu cuenta tendra acceso como cliente y proveedor. El proveedor quedara pendiente de aprobacion.</div>
                {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                <div className="flex flex-wrap items-center justify-between gap-3"><Button type="button" variant="outline" onClick={() => { setPaso('cuenta'); setError(''); }}>Atras</Button><Button type="button" onClick={enviar} disabled={enviando}>{enviando ? 'Creando cuenta…' : 'Crear cuenta de proveedor'}</Button></div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
