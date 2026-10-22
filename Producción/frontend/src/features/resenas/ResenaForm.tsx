import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { crearResena, type TipoResena } from './api';

export const ETIQUETAS_RESENA: Record<TipoResena, string> = {
  CLIENTE_A_VEHICULO: 'Calificar vehiculo',
  CLIENTE_A_PROVEEDOR: 'Calificar proveedor',
  PROVEEDOR_A_CLIENTE: 'Calificar cliente',
};

interface ResenaFormProps {
  idArriendo: number;
  tipo: TipoResena;
}

export function ResenaForm({ idArriendo, tipo }: ResenaFormProps) {
  const queryClient = useQueryClient();
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      crearResena({
        ID_arriendo: idArriendo,
        tipo_resena: tipo,
        calificacion,
        comentario: comentario.trim() || undefined,
      }),
    onSuccess: () => {
      setCalificacion(0);
      setComentario('');
      void queryClient.invalidateQueries({ queryKey: ['arriendo', idArriendo] });
    },
  });

  const etiqueta = ETIQUETAS_RESENA[tipo];

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 p-3 text-sm">
      <p className="font-medium">{etiqueta}</p>
      <div className="flex items-center gap-1" role="group" aria-label={`Calificacion: ${etiqueta}`}>
        {[1, 2, 3, 4, 5].map((valor) => (
          <button
            key={valor}
            type="button"
            aria-label={`${valor} ${valor === 1 ? 'estrella' : 'estrellas'}`}
            aria-pressed={calificacion === valor}
            onClick={() => setCalificacion(valor)}
            className={
              valor <= calificacion
                ? 'text-xl text-amber-500'
                : 'text-xl text-slate-300 hover:text-amber-400'
            }
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-xs text-slate-500">
          {calificacion > 0 ? `${calificacion}/5` : 'Selecciona una calificacion'}
        </span>
      </div>
      <textarea
        value={comentario}
        onChange={(event) => setComentario(event.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="Comentario (opcional)"
        aria-label={`Comentario para ${etiqueta.toLowerCase()}`}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      />
      {mutation.isError && (
        <p className="text-red-600">
          {mutation.error instanceof Error
            ? mutation.error.message
            : 'No se pudo registrar la resena.'}
        </p>
      )}
      <Button
        type="button"
        disabled={calificacion === 0 || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? 'Enviando…' : 'Enviar resena'}
      </Button>
    </div>
  );
}
