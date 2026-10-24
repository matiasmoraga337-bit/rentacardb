import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useCatalogo } from '@/features/catalogos/hooks';

interface FiltrosCatalogoProps {
  idTipo?: number;
  precioMax?: number;
  onTipo: (value: number | undefined) => void;
  onPrecioMax: (value: number | undefined) => void;
  onBuscar: () => void;
  onLimpiar: () => void;
}

export function FiltrosCatalogo({
  idTipo,
  precioMax,
  onTipo,
  onPrecioMax,
  onBuscar,
  onLimpiar,
}: FiltrosCatalogoProps) {
  const tipos = useCatalogo('tipos-vehiculo');

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <SlidersHorizontal className="h-4 w-4 text-brand" aria-hidden="true" />
          Filtros avanzados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="filtro-tipo">Tipo de vehículo</Label>
          <Select
            id="filtro-tipo"
            value={idTipo ?? ''}
            onChange={(event) => onTipo(event.target.value ? Number(event.target.value) : undefined)}
          >
            <option value="">Todos</option>
            {tipos.data?.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filtro-precio">Precio máximo por día</Label>
          <Input
            id="filtro-precio"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Ej. 50000"
            value={precioMax ?? ''}
            onChange={(event) =>
              onPrecioMax(event.target.value ? Number(event.target.value) : undefined)
            }
          />
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button type="button" onClick={onBuscar}>
            Aplicar filtros
          </Button>
          <Button type="button" variant="ghost" onClick={onLimpiar}>
            Limpiar filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
