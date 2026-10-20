import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCatalogo } from '@/features/catalogos/hooks';
import { fetchMio, fetchSedes } from '@/features/proveedores/api';
import { crearVehiculo } from './api';

export function VehiculoFormPage() {
  const navigate = useNavigate();
  const proveedorQuery = useQuery({ queryKey: ['proveedor-mio'], queryFn: fetchMio, retry: false });
  const sedesQuery = useQuery({
    queryKey: ['sedes', proveedorQuery.data?.id],
    queryFn: () => fetchSedes(proveedorQuery.data!.id),
    enabled: Boolean(proveedorQuery.data?.id),
  });

  const marcas = useCatalogo('marcas');
  const tipos = useCatalogo('tipos-vehiculo');
  const combustibles = useCatalogo('combustibles');
  const transmisiones = useCatalogo('transmisiones');

  const [idMarca, setIdMarca] = useState<number | undefined>();
  const modelos = useCatalogo('modelos', idMarca);

  const [idModelo, setIdModelo] = useState<number | undefined>();
  const [idTipo, setIdTipo] = useState<number | undefined>();
  const [idCombustible, setIdCombustible] = useState<number | undefined>();
  const [idTransmision, setIdTransmision] = useState<number | undefined>();
  const [idSede, setIdSede] = useState<number | undefined>();
  const [patente, setPatente] = useState('');
  const [vin, setVin] = useState('');
  const [anio, setAnio] = useState(2020);
  const [kilometraje, setKilometraje] = useState(0);
  const [precio, setPrecio] = useState(25000);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (proveedorQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Necesitas un proveedor aprobado</CardTitle>
          <CardDescription>Registra tu proveedor antes de crear vehiculos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/proveedor/registro')}>Ir a registro</Button>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError('');
    if (!idModelo || !idTipo || !idCombustible || !idTransmision) {
      setError('Completa marca/modelo, tipo, combustible y transmision.');
      return;
    }
    try {
      setEnviando(true);
      const result = await crearVehiculo({
        ID_modelo: idModelo,
        ID_tipo_vehiculo: idTipo,
        ID_tipo_combustible: idCombustible,
        ID_tipo_transmision: idTransmision,
        patente: patente.toUpperCase(),
        vin: vin.toUpperCase(),
        anio,
        kilometraje,
        precioDiarioBase: precio,
        ID_sede_actual: idSede,
      });
      navigate(`/proveedor/vehiculos/${result.ID_vehiculo}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el vehiculo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo vehiculo</h1>
      <Card>
        <CardHeader>
          <CardTitle>Datos del vehiculo</CardTitle>
          <CardDescription>Patente formato ABCD12 o ABC12.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Select
                  id="marca"
                  value={idMarca ?? ''}
                  onChange={(e) => {
                    setIdMarca(e.target.value ? Number(e.target.value) : undefined);
                    setIdModelo(undefined);
                  }}
                >
                  <option value="">Seleccionar…</option>
                  {marcas.data?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Select
                  id="modelo"
                  value={idModelo ?? ''}
                  disabled={!idMarca}
                  onChange={(e) => setIdModelo(Number(e.target.value) || undefined)}
                >
                  <option value="">Seleccionar…</option>
                  {modelos.data?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  id="tipo"
                  value={idTipo ?? ''}
                  onChange={(e) => setIdTipo(Number(e.target.value) || undefined)}
                >
                  <option value="">Seleccionar…</option>
                  {tipos.data?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="combustible">Combustible</Label>
                <Select
                  id="combustible"
                  value={idCombustible ?? ''}
                  onChange={(e) => setIdCombustible(Number(e.target.value) || undefined)}
                >
                  <option value="">Seleccionar…</option>
                  {combustibles.data?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transmision">Transmision</Label>
                <Select
                  id="transmision"
                  value={idTransmision ?? ''}
                  onChange={(e) => setIdTransmision(Number(e.target.value) || undefined)}
                >
                  <option value="">Seleccionar…</option>
                  {transmisiones.data?.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sede">Sede actual</Label>
                <Select
                  id="sede"
                  value={idSede ?? ''}
                  onChange={(e) => setIdSede(Number(e.target.value) || undefined)}
                >
                  <option value="">Sin sede</option>
                  {sedesQuery.data?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="patente">Patente</Label>
                <Input
                  id="patente"
                  value={patente}
                  onChange={(e) => setPatente(e.target.value.toUpperCase())}
                  maxLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vin">VIN (17)</Label>
                <Input
                  id="vin"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  maxLength={17}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anio">Anio</Label>
                <Input
                  id="anio"
                  type="number"
                  value={anio}
                  onChange={(e) => setAnio(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="km">Kilometraje</Label>
                <Input
                  id="km"
                  type="number"
                  min={0}
                  value={kilometraje}
                  onChange={(e) => setKilometraje(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precio">Precio por dia (CLP)</Label>
                <Input
                  id="precio"
                  type="number"
                  min={1}
                  value={precio}
                  onChange={(e) => setPrecio(Number(e.target.value))}
                />
              </div>
            </div>
            {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
            <Button type="submit" disabled={enviando}>
              {enviando ? 'Creando…' : 'Crear vehiculo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
