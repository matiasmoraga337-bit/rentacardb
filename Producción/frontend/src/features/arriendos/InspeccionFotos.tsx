import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { subirFotosInspeccion, type InspeccionArriendo } from './api';

export function InspeccionFotos({
  idArriendo,
  inspeccion,
}: {
  idArriendo: number;
  inspeccion: InspeccionArriendo;
}) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<FileList | null>(null);
  const [mensaje, setMensaje] = useState('');

  const mutation = useMutation({
    mutationFn: () => subirFotosInspeccion(idArriendo, inspeccion.id, files as FileList),
    onSuccess: () => {
      setMensaje('Fotos subidas.');
      setFiles(null);
      queryClient.invalidateQueries({ queryKey: ['arriendo', idArriendo] });
    },
  });

  return (
    <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
      <div className="flex flex-wrap gap-2">
        {inspeccion.fotos.map((foto) => (
          <a key={foto.id} href={foto.url} target="_blank" rel="noreferrer">
            <img
              src={foto.thumbUrl}
              alt={`Foto inspeccion ${foto.id}`}
              className="h-16 w-24 rounded border border-slate-200 object-cover"
            />
          </a>
        ))}
        {inspeccion.fotos.length === 0 && (
          <p className="text-xs text-slate-500">Sin fotos.</p>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor={`fotos-${inspeccion.id}`}>Agregar fotos</Label>
          <input
            id={`fotos-${inspeccion.id}`}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(event.target.files)}
            className="block text-xs text-slate-600"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={mutation.isPending || !files || files.length === 0}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? 'Subiendo…' : 'Subir'}
        </Button>
      </div>
      {mutation.isError && (
        <p className="text-xs text-red-600">
          {mutation.error instanceof Error ? mutation.error.message : 'No se pudieron subir.'}
        </p>
      )}
      {mensaje && <p className="text-xs text-emerald-700">{mensaje}</p>}
    </div>
  );
}
