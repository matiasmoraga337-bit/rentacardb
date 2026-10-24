import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/features/auth/AuthContext';
import { agregarFavorito, fetchFavoritos, quitarFavorito } from './api';

export function FavoritoButton({ vehiculoId }: { vehiculoId: number }) {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['favoritos'],
    queryFn: fetchFavoritos,
    enabled: Boolean(usuario),
  });
  const esFavorito = Boolean(query.data?.some((favorito) => favorito.vehiculoId === vehiculoId));

  const mutation = useMutation({
    mutationFn: () =>
      esFavorito ? quitarFavorito(vehiculoId) : agregarFavorito(vehiculoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoritos'] });
      showToast(esFavorito ? 'Vehículo quitado de favoritos.' : 'Vehículo agregado a favoritos.');
    },
    onError: (error) => {
      showToast(
        error instanceof Error ? error.message : 'No se pudo actualizar el favorito.',
        'error',
      );
    },
  });

  if (!usuario) return null;

  return (
    <button
      type="button"
      aria-label={esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      aria-pressed={esFavorito}
      disabled={mutation.isPending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        mutation.mutate();
      }}
      className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-500 shadow-sm hover:text-red-500"
    >
      <Heart className={`h-5 w-5 ${esFavorito ? 'fill-red-500 text-red-500' : ''}`} />
    </button>
  );
}
