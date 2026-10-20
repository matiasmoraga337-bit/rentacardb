import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useComunas, useProvincias, useRegiones } from '@/features/catalogos/hooks';

interface UbicacionSelectProps {
  onChange: (idComuna: number | undefined) => void;
}

export function UbicacionSelect({ onChange }: UbicacionSelectProps) {
  const [idRegion, setIdRegion] = useState<number | undefined>();
  const [idProvincia, setIdProvincia] = useState<number | undefined>();

  const regiones = useRegiones();
  const provincias = useProvincias(idRegion);
  const comunas = useComunas(idProvincia);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <Label htmlFor="region">Region</Label>
        <Select
          id="region"
          value={idRegion ?? ''}
          onChange={(e) => {
            const value = e.target.value ? Number(e.target.value) : undefined;
            setIdRegion(value);
            setIdProvincia(undefined);
            onChange(undefined);
          }}
        >
          <option value="">Seleccionar…</option>
          {regiones.data?.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="provincia">Provincia</Label>
        <Select
          id="provincia"
          value={idProvincia ?? ''}
          disabled={!idRegion}
          onChange={(e) => {
            const value = e.target.value ? Number(e.target.value) : undefined;
            setIdProvincia(value);
            onChange(undefined);
          }}
        >
          <option value="">Seleccionar…</option>
          {provincias.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="comuna">Comuna</Label>
        <Select
          id="comuna"
          disabled={!idProvincia}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Seleccionar…</option>
          {comunas.data?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
