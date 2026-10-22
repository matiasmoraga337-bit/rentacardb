import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/AuthContext';
import { formatearCLP, formatearFecha, formatearFechaHora } from '@/features/reservas/format';
import { fetchArriendo } from './api';
import { ConductorForm } from './ConductorForm';
import { ContratoPanel } from './ContratoPanel';
import { DanosForm } from './DanosForm';
import { DevolucionForm } from './DevolucionForm';
import { EstadoArriendoBadge } from './EstadoArriendoBadge';

export function ArriendoDetallePage() {
  const { id } = useParams();
  const idArriendo = Number(id);
  const { usuario } = useAuth();

  const query = useQuery({
    queryKey: ['arriendo', idArriendo],
    queryFn: () => fetchArriendo(idArriendo),
    enabled: Number.isInteger(idArriendo) && idArriendo > 0,
  });

  if (query.isLoading) return <p className="text-slate-500">Cargando arriendo…</p>;
  if (query.isError || !query.data) {
    return <p className="text-sm text-red-600">No se pudo cargar el arriendo.</p>;
  }

  const arriendo = query.data;
  const esCliente = usuario?.id === arriendo.clienteId;
  const esOperador =
    usuario?.roles.includes('PROVEEDOR') ||
    usuario?.roles.includes('OPERADOR') ||
    usuario?.roles.includes('ADMIN');
  const inspeccionDevolucion = arriendo.inspecciones.find((i) => i.tipo === 'DEVOLUCION');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Arriendo #{arriendo.id}</h1>
            <EstadoArriendoBadge estado={arriendo.estado} />
          </div>
          <p className="text-sm text-slate-600">
            Reserva #{arriendo.reservaId} · {arriendo.proveedor}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/reservas/${arriendo.reservaId}`}>
            <Button variant="outline">Ver reserva</Button>
          </Link>
          <Link to={esCliente ? '/arriendos' : '/proveedor/arriendos'}>
            <Button variant="outline">Volver</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vehiculo y fechas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-lg font-semibold">
              {arriendo.marca} {arriendo.modelo}
            </p>
            <p className="text-slate-600">{arriendo.patente}</p>
            <p>
              <span className="font-medium">Periodo:</span> {formatearFecha(arriendo.fechaInicio)} →{' '}
              {formatearFecha(arriendo.fechaFin)}
            </p>
            <p>
              <span className="font-medium">Retiro real:</span>{' '}
              {formatearFechaHora(arriendo.fechaRetiro)} · {arriendo.sedeRetiroReal}
            </p>
            {arriendo.fechaDevolucion && (
              <p>
                <span className="font-medium">Devolucion real:</span>{' '}
                {formatearFechaHora(arriendo.fechaDevolucion)} ·{' '}
                {arriendo.sedeDevolucionReal}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kilometraje y combustible</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Km inicial</span>
              <span>{arriendo.kmInicial.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between">
              <span>Km final</span>
              <span>
                {arriendo.kmFinal !== null ? arriendo.kmFinal.toLocaleString('es-CL') : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Combustible inicial</span>
              <span>{arriendo.combustibleInicial}%</span>
            </div>
            <div className="flex justify-between">
              <span>Combustible final</span>
              <span>
                {arriendo.combustibleFinal !== null ? `${arriendo.combustibleFinal}%` : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="font-medium">{arriendo.cliente}</p>
          <p className="text-slate-600">{arriendo.emailCliente}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inspecciones</CardTitle>
          <CardDescription>Entrega y devolucion registradas por el operador.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {arriendo.inspecciones.length === 0 && (
            <p className="text-sm text-slate-500">Sin inspecciones registradas.</p>
          )}
          {arriendo.inspecciones.map((inspeccion) => (
            <div key={inspeccion.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium">
                {inspeccion.tipo} · {formatearFechaHora(inspeccion.fecha)}
              </p>
              <p className="text-slate-600">
                Km {inspeccion.kilometraje.toLocaleString('es-CL')} · Combustible{' '}
                {inspeccion.combustible}% · Limpieza {inspeccion.limpieza ?? '—'}
              </p>
              {inspeccion.observaciones && (
                <p className="text-slate-600">{inspeccion.observaciones}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danos registrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {arriendo.danos.length === 0 && (
            <p className="text-sm text-slate-500">Sin danos registrados.</p>
          )}
          {arriendo.danos.map((dano) => (
            <div key={dano.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium">
                {dano.zona} · {dano.tipo} · {dano.severidad}
              </p>
              <p className="text-slate-600">
                {dano.descripcion ?? 'Sin descripcion.'}
                {dano.montoEstimado !== null ? ` · ${formatearCLP(dano.montoEstimado)}` : ''}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cargos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {arriendo.cargos.length === 0 && (
            <p className="text-sm text-slate-500">Sin cargos adicionales.</p>
          )}
          {arriendo.cargos.map((cargo) => (
            <div key={cargo.id} className="flex items-center justify-between text-sm">
              <span>
                {cargo.concepto} ({cargo.tipo ?? 'OTRO'}) · {cargo.estado}
              </span>
              <span className="font-medium">{formatearCLP(cargo.monto)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conductores adicionales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {arriendo.conductores.length === 0 && (
            <p className="text-sm text-slate-500">Sin conductores adicionales.</p>
          )}
          {arriendo.conductores.map((conductor) => (
            <div key={conductor.id} className="text-sm">
              <p className="font-medium">
                {conductor.nombre} · {conductor.rut}
              </p>
              <p className="text-slate-600">
                Licencia {conductor.numeroLicencia ?? 'no informada'}
                {conductor.vencimientoLicencia
                  ? ` · vence ${formatearFecha(conductor.vencimientoLicencia)}`
                  : ''}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {esCliente && arriendo.estado === 'ACTIVO' && <ConductorForm idArriendo={arriendo.id} />}
      {esCliente && (
        <ContratoPanel idArriendo={arriendo.id} puedeAceptar={arriendo.estado === 'ACTIVO'} />
      )}

      {esOperador && arriendo.estado === 'ACTIVO' && <DevolucionForm arriendo={arriendo} />}
      {esOperador && inspeccionDevolucion && (
        <DanosForm idArriendo={arriendo.id} inspeccion={inspeccionDevolucion} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resenas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {arriendo.resenas.length === 0 && (
            <p className="text-sm text-slate-500">Sin resenas registradas.</p>
          )}
          {arriendo.resenas.map((resena) => (
            <div key={resena.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium">
                {resena.calificacion}/5 · {resena.tipo}
              </p>
              <p className="text-slate-600">{resena.comentario ?? 'Sin comentario.'}</p>
              <p className="text-xs text-slate-500">
                {resena.autor} · {formatearFechaHora(resena.fecha)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
