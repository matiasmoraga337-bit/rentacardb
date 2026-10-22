import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCatalogo } from '@/features/catalogos/hooks';
import {
  actualizarCatalogo,
  crearCatalogo,
  desactivarCatalogo,
  fetchCatalogoAdmin,
  type CatalogoAdminItem,
} from '@/features/catalogos/api';

const CATALOGOS = [
  { valor: 'marcas', etiqueta: 'Marcas' },
  { valor: 'modelos', etiqueta: 'Modelos' },
  { valor: 'tipos-vehiculo', etiqueta: 'Tipos de vehiculo' },
  { valor: 'combustibles', etiqueta: 'Combustibles' },
  { valor: 'transmisiones', etiqueta: 'Transmisiones' },
  { valor: 'caracteristicas', etiqueta: 'Caracteristicas' },
  { valor: 'tipos-documento', etiqueta: 'Tipos de documento' },
  { valor: 'politicas-cancelacion', etiqueta: 'Politicas de cancelacion' },
  { valor: 'tipos-proveedor', etiqueta: 'Tipos de proveedor (solo lectura)' },
  { valor: 'estados-vehiculo', etiqueta: 'Estados de vehiculo (solo lectura)' },
  { valor: 'estados-publicacion', etiqueta: 'Estados de publicacion (solo lectura)' },
];

const EDITABLES = new Set([
  'marcas',
  'modelos',
  'tipos-vehiculo',
  'combustibles',
  'transmisiones',
  'caracteristicas',
  'tipos-documento',
  'politicas-cancelacion',
]);

export function AdminCatalogosPage() {
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState('marcas');
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [activo, setActivo] = useState(true);
  const [marcaId, setMarcaId] = useState<number | undefined>();
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [obligatorio, setObligatorio] = useState(false);
  const [dias, setDias] = useState(0);
  const [porcentaje, setPorcentaje] = useState(0);
  const [mensaje, setMensaje] = useState('');

  const editable = EDITABLES.has(tipo);
  const etiqueta = CATALOGOS.find((catalogo) => catalogo.valor === tipo)?.etiqueta ?? tipo;
  const marcas = useCatalogo('marcas');

  const query = useQuery({
    queryKey: ['catalogo-admin', tipo, incluirInactivos],
    queryFn: () => fetchCatalogoAdmin(tipo, incluirInactivos),
  });

  const reset = (): void => {
    setEditandoId(null);
    setNombre('');
    setActivo(true);
    setMarcaId(undefined);
    setCategoria('');
    setDescripcion('');
    setObligatorio(false);
    setDias(0);
    setPorcentaje(0);
  };

  const invalidar = (): void => {
    queryClient.invalidateQueries({ queryKey: ['catalogo-admin', tipo] });
    queryClient.invalidateQueries({ queryKey: ['catalogo', tipo] });
  };

  const guardarMutation = useMutation({
    mutationFn: () => {
      const data: Record<string, unknown> = {
        nombre: nombre.trim(),
        activo,
      };
      if (tipo === 'modelos') data.ID_marca_modelo = marcaId;
      if (tipo === 'caracteristicas') {
        data.categoria = categoria.trim();
        data.descripcion = descripcion.trim() || undefined;
      }
      if (tipo === 'tipos-documento') data.obligatorio = obligatorio;
      if (tipo === 'politicas-cancelacion') {
        data.descripcion = descripcion.trim() || undefined;
        data.dias_anticipacion = dias;
        data.porcentaje_reembolso = porcentaje;
      }
      return editandoId
        ? actualizarCatalogo(tipo, editandoId, data)
        : crearCatalogo(tipo, data);
    },
    onSuccess: () => {
      setMensaje(editandoId ? 'Registro actualizado.' : 'Registro creado.');
      reset();
      invalidar();
    },
  });

  const desactivarMutation = useMutation({
    mutationFn: (id: number) => desactivarCatalogo(tipo, id),
    onSuccess: () => {
      setMensaje('Registro desactivado.');
      invalidar();
    },
  });

  const cargar = (item: CatalogoAdminItem): void => {
    setEditandoId(item.id);
    setNombre(item.nombre);
    setActivo(item.activo);
    setMarcaId(item.marcaId);
    setCategoria(item.categoria ?? '');
    setDescripcion(item.descripcion ?? '');
    setObligatorio(Boolean(item.obligatorio));
    setDias(item.diasAnticipacion ?? 0);
    setPorcentaje(item.porcentajeReembolso ?? 0);
    setMensaje('');
  };

  const detalle = (item: CatalogoAdminItem): string => {
    if (tipo === 'modelos') {
      return marcas.data?.find((marca) => marca.id === item.marcaId)?.nombre ?? `Marca #${item.marcaId}`;
    }
    if (tipo === 'caracteristicas') {
      return `${item.categoria ?? '—'} · ${item.descripcion ?? 'Sin descripcion'}`;
    }
    if (tipo === 'tipos-documento') {
      return item.obligatorio ? 'Obligatorio' : 'Opcional';
    }
    if (tipo === 'politicas-cancelacion') {
      return `${item.diasAnticipacion ?? 0} dias · ${item.porcentajeReembolso ?? 0}% · ${
        item.descripcion ?? 'Sin descripcion'
      }`;
    }
    return '—';
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Catalogos</h1>
        <p className="text-sm text-slate-600">
          Alta, edicion y desactivacion de catalogos de negocio. Los estados del sistema son de
          solo lectura.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-end justify-between space-y-0">
          <div>
            <CardTitle>{etiqueta}</CardTitle>
            <CardDescription>
              {query.data ? `${query.data.length} registro(s).` : 'Cargando…'}
            </CardDescription>
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={incluirInactivos}
                onChange={(event) => setIncluirInactivos(event.target.checked)}
              />
              Incluir inactivos
            </label>
            <div className="w-64">
              <Select
                aria-label="Seleccionar catalogo"
                value={tipo}
                onChange={(event) => {
                  setTipo(event.target.value);
                  reset();
                  setMensaje('');
                }}
              >
                {CATALOGOS.map((catalogo) => (
                  <option key={catalogo.valor} value={catalogo.valor}>
                    {catalogo.etiqueta}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!editable && (
            <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">
              Este catalogo es de solo lectura porque controla estados del sistema.
            </p>
          )}

          {editable && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-medium">
                {editandoId ? `Editar registro #${editandoId}` : 'Nuevo registro'}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="catalogoNombre">Nombre</Label>
                  <Input
                    id="catalogoNombre"
                    value={nombre}
                    maxLength={100}
                    onChange={(event) => setNombre(event.target.value)}
                  />
                </div>
                {tipo === 'modelos' && (
                  <div className="space-y-1">
                    <Label htmlFor="catalogoMarca">Marca</Label>
                    <Select
                      id="catalogoMarca"
                      value={marcaId ?? ''}
                      onChange={(event) =>
                        setMarcaId(event.target.value ? Number(event.target.value) : undefined)
                      }
                    >
                      <option value="">Selecciona marca</option>
                      {marcas.data?.map((marca) => (
                        <option key={marca.id} value={marca.id}>
                          {marca.nombre}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
                {tipo === 'caracteristicas' && (
                  <div className="space-y-1">
                    <Label htmlFor="catalogoCategoria">Categoria</Label>
                    <Input
                      id="catalogoCategoria"
                      value={categoria}
                      maxLength={30}
                      onChange={(event) => setCategoria(event.target.value)}
                    />
                  </div>
                )}
                {tipo === 'politicas-cancelacion' && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="catalogoDias">Dias de anticipacion</Label>
                      <Input
                        id="catalogoDias"
                        type="number"
                        min={0}
                        max={365}
                        value={dias}
                        onChange={(event) => setDias(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="catalogoPorcentaje">% reembolso</Label>
                      <Input
                        id="catalogoPorcentaje"
                        type="number"
                        min={0}
                        max={100}
                        value={porcentaje}
                        onChange={(event) => setPorcentaje(Number(event.target.value))}
                      />
                    </div>
                  </>
                )}
                <div className="flex items-end">
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(event) => setActivo(event.target.checked)}
                    />
                    Activo
                  </label>
                </div>
              </div>
              {(tipo === 'caracteristicas' || tipo === 'politicas-cancelacion') && (
                <div className="space-y-1">
                  <Label htmlFor="catalogoDescripcion">Descripcion</Label>
                  <Input
                    id="catalogoDescripcion"
                    value={descripcion}
                    maxLength={tipo === 'caracteristicas' ? 200 : 300}
                    onChange={(event) => setDescripcion(event.target.value)}
                  />
                </div>
              )}
              {tipo === 'tipos-documento' && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={obligatorio}
                    onChange={(event) => setObligatorio(event.target.checked)}
                  />
                  Documento obligatorio
                </label>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  disabled={
                    guardarMutation.isPending ||
                    !nombre.trim() ||
                    (tipo === 'modelos' && !marcaId) ||
                    (tipo === 'caracteristicas' && !categoria.trim())
                  }
                  onClick={() => guardarMutation.mutate()}
                >
                  {guardarMutation.isPending ? 'Guardando…' : 'Guardar'}
                </Button>
                {editandoId && (
                  <Button type="button" variant="outline" onClick={reset}>
                    Cancelar
                  </Button>
                )}
              </div>
              {guardarMutation.isError && (
                <p className="text-sm text-red-600">
                  {guardarMutation.error instanceof Error
                    ? guardarMutation.error.message
                    : 'No se pudo guardar.'}
                </p>
              )}
              {mensaje && <p className="text-sm text-emerald-700">{mensaje}</p>}
            </div>
          )}

          {query.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {query.isError && <p className="text-sm text-red-600">No se pudo cargar el catalogo.</p>}
          {query.data && query.data.length === 0 && (
            <p className="text-sm text-slate-500">Sin registros.</p>
          )}
          {query.data && query.data.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2">ID</th>
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Detalle</th>
                  <th className="py-2">Estado</th>
                  {editable && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {query.data.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2">{item.id}</td>
                    <td className="py-2">{item.nombre}</td>
                    <td className="py-2 text-slate-600">{detalle(item)}</td>
                    <td className="py-2">{item.activo ? 'Activo' : 'Inactivo'}</td>
                    {editable && (
                      <td className="space-x-2 py-2 text-right">
                        <Button size="sm" variant="outline" onClick={() => cargar(item)}>
                          Editar
                        </Button>
                        {item.activo && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={desactivarMutation.isPending}
                            onClick={() => desactivarMutation.mutate(item.id)}
                          >
                            Desactivar
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
