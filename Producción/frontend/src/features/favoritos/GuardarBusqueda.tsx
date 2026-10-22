import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { guardarBusqueda } from './api';

export function GuardarBusqueda({
  filtros,
}: {
  filtros: {
    fecha_desde?: string;
    fecha_hasta?: string;
    ID_comuna?: number;
    ID_tipo_vehiculo?: number;
    precio_maximo?: number;
  };
}) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const mutation = useMutation({
    mutationFn: () => guardarBusqueda({ ...filtros, nombre: nombre.trim() || undefined }),
    onSuccess: () => {
      setNombre('');
      queryClient.invalidateQueries({ queryKey: ['busquedas'] });
    },
  });

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="w-56 space-y-1">
        <Input
          aria-label="Nombre de la busqueda"
          value={nombre}
          maxLength={100}
          placeholder="Nombre de la busqueda"
          onChange={(event) => setNombre(event.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? 'Guardando…' : 'Guardar busqueda'}
      </Button>
      {mutation.isError && (
        <p className="text-sm text-red-600">
          {mutation.error instanceof Error ? mutation.error.message : 'No se pudo guardar.'}
        </p>
      )}
      {mutation.isSuccess && <p className="text-sm text-emerald-700">Busqueda guardada.</p>}
    </div>
  );
}
