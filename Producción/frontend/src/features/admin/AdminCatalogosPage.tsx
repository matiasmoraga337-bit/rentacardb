import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useCatalogo } from '@/features/catalogos/hooks';

const CATALOGOS = [
  { valor: 'marcas', etiqueta: 'Marcas' },
  { valor: 'modelos', etiqueta: 'Modelos' },
  { valor: 'tipos-vehiculo', etiqueta: 'Tipos de vehiculo' },
  { valor: 'combustibles', etiqueta: 'Combustibles' },
  { valor: 'transmisiones', etiqueta: 'Transmisiones' },
  { valor: 'caracteristicas', etiqueta: 'Caracteristicas' },
  { valor: 'tipos-documento', etiqueta: 'Tipos de documento' },
  { valor: 'tipos-proveedor', etiqueta: 'Tipos de proveedor' },
  { valor: 'politicas-cancelacion', etiqueta: 'Politicas de cancelacion' },
  { valor: 'estados-vehiculo', etiqueta: 'Estados de vehiculo' },
  { valor: 'estados-publicacion', etiqueta: 'Estados de publicacion' },
];

export function AdminCatalogosPage() {
  const [tipo, setTipo] = useState('marcas');
  const query = useCatalogo(tipo);
  const etiqueta = CATALOGOS.find((catalogo) => catalogo.valor === tipo)?.etiqueta ?? tipo;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Catalogos</h1>
        <p className="text-sm text-slate-600">
          Consulta de catalogos maestros. La edicion administrativa se habilita en S4.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-end justify-between space-y-0">
          <div>
            <CardTitle>{etiqueta}</CardTitle>
            <CardDescription>Datos activos usados por la plataforma.</CardDescription>
          </div>
          <div className="w-64">
            <Select
              aria-label="Seleccionar catalogo"
              value={tipo}
              onChange={(event) => setTipo(event.target.value)}
            >
              {CATALOGOS.map((catalogo) => (
                <option key={catalogo.valor} value={catalogo.valor}>
                  {catalogo.etiqueta}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {query.isLoading && <p className="text-sm text-slate-500">Cargando…</p>}
          {query.isError && <p className="text-sm text-red-600">No se pudo cargar el catalogo.</p>}
          {query.data && query.data.length === 0 && (
            <p className="text-sm text-slate-500">Sin registros activos.</p>
          )}
          {query.data && query.data.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2">ID</th>
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Extra</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-2">{item.id}</td>
                    <td className="py-2">{item.nombre}</td>
                    <td className="py-2">{String(item.extra ?? '—')}</td>
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
