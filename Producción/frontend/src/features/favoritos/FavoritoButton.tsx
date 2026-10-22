import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { agregarFavorito, fetchFavoritos, quitarFavorito } from './api';

export function FavoritoButton({ vehiculoId }: { vehiculoId: number }) {
  const { usuario } = useAuth();
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoritos'] }),
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
      className="rounded-full bg-white/90 p-1.5 text-slate-500 shadow-sm hover:text-red-500"
    >
      <Heart className={`h-4 w-4 ${esFavorito ? 'fill-red-500 text-red-500' : ''}`} />
    </button>
  );
}
