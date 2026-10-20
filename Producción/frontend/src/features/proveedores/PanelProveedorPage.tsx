import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UbicacionSelect } from '@/components/forms/UbicacionSelect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  actualizarConfiguracion,
  crearSede,
  eliminarSede,
  fetchMio,
  fetchSedes,
} from './api';

export function PanelProveedorPage() {
  const queryClient = useQueryClient();
  const proveedorQuery = useQuery({ queryKey: ['proveedor-mio'], queryFn: fetchMio, retry: false });
  const proveedor = proveedorQuery.data;

  const [minutos, setMinutos] = useState(30);
  const [requiereDeposito, setRequiereDeposito] = useState(false);
  const [montoDeposito, setMontoDeposito] = useState(0);
  const [mensaje, setMensaje] = useState('');

  const [nombreSede, setNombreSede] = useState('');
  const [direccionSede, setDireccionSede] = useState('');
  const [idComuna, setIdComuna] = useState<number | undefined>();

  useEffect(() => {
    if (proveedor) {
      setMinutos(proveedor.minutosExpiracionReserva ?? 30);
      setRequiereDeposito(Boolean(proveedor.requiereDeposito));
      setMontoDeposito(proveedor.montoDeposito ?? 0);
    }
  }, [proveedor]);

  const sedesQuery = useQuery({
    queryKey: ['sedes', proveedor?.id],
    queryFn: () => fetchSedes(proveedor!.id),
    enabled: Boolean(proveedor?.id),
  });

  const configMutation = useMutation({
    mutationFn: () =>
      actualizarConfiguracion(proveedor!.id, {
        minutos_expiracion_reserva: minutos,
        requiere_deposito: requiereDeposito,
        monto_deposito: montoDeposito,
      }),
    onSuccess: () => {
      setMensaje('Configuracion guardada.');
      queryClient.invalidateQueries({ queryKey: ['proveedor-mio'] });
    },
  });

  const crearSedeMutation = useMutation({
    mutationFn: () =>
      crearSede(proveedor!.id, {
        ID_comuna: idComuna as number,
        nombre: nombreSede,
        direccion: direccionSede,
      }),
    onSuccess: () => {
      setNombreSede('');
      setDireccionSede('');
      setIdComuna(undefined);
      queryClient.invalidateQueries({ queryKey: ['sedes', proveedor?.id] });
    },
  });

  const eliminarSedeMutation = useMutation({
    mutationFn: (sedeId: number) => eliminarSede(proveedor!.id, sedeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sedes', proveedor?.id] }),
  });

  if (proveedorQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Aun no eres proveedor</CardTitle>
          <CardDescription>Registra tu proveedor para gestionar vehiculos y sedes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/proveedor/registro">
            <Button>Registrarme como proveedor</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!proveedor) return <p className="text-slate-500">Cargando proveedor…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{proveedor.nombreComercial}</h1>
        <p className="text-sm text-slate-600">
          Tipo {proveedor.tipo} · Estado <strong>{proveedor.estado}</strong>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuracion</CardTitle>
          <CardDescription>Reglas de reserva y deposito.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              setMensaje('');
              configMutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="minutos">Minutos de expiracion</Label>
              <Input
                id="minutos"
                type="number"
                min={1}
                value={minutos}
                onChange={(e) => setMinutos(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monto">Deposito (CLP)</Label>
              <Input
                id="monto"
                type="number"
                min={0}
                value={montoDeposito}
                onChange={(e) => setMontoDeposito(Number(e.target.value))}
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={requiereDeposito}
                  onChange={(e) => setRequiereDeposito(e.target.checked)}
                />
                Requiere deposito
              </label>
              <Button type="submit" disabled={configMutation.isPending}>
                Guardar
              </Button>
            </div>
          </form>
          {mensaje && <p className="mt-2 text-sm text-emerald-700">{mensaje}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sedes</CardTitle>
          <CardDescription>Lugares de retiro y devolucion.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="divide-y divide-slate-100">
            {sedesQuery.data?.map((sede) => (
              <li key={sede.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p className="font-medium">{sede.nombre}</p>
                  <p className="text-slate-500">
                    {sede.comuna} · {sede.direccion} {sede.activo ? '' : '(inactiva)'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => eliminarSedeMutation.mutate(sede.id)}
                >
                  Eliminar
                </Button>
              </li>
            ))}
            {sedesQuery.data?.length === 0 && (
              <li className="py-2 text-sm text-slate-500">Sin sedes registradas.</li>
            )}
          </ul>

          <form
            className="space-y-3 rounded-lg border border-slate-200 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              crearSedeMutation.mutate();
            }}
          >
            <p className="text-sm font-medium">Agregar sede</p>
            <UbicacionSelect onChange={setIdComuna} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="sedeNombre">Nombre</Label>
                <Input
                  id="sedeNombre"
                  value={nombreSede}
                  onChange={(e) => setNombreSede(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sedeDireccion">Direccion</Label>
                <Input
                  id="sedeDireccion"
                  value={direccionSede}
                  onChange={(e) => setDireccionSede(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={crearSedeMutation.isPending || !idComuna}
            >
              Agregar sede
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
