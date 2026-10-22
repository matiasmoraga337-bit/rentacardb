import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { crearResena } from '../api';
import { ResenaForm } from '../ResenaForm';

vi.mock('../api', () => ({
  crearResena: vi.fn().mockResolvedValue({
    id: 1,
    arriendoId: 5,
    tipo: 'CLIENTE_A_VEHICULO',
    calificacion: 5,
    comentario: 'Muy buen servicio',
    fecha: '2026-10-22T10:00:00',
    autorId: 2,
    autor: 'Cliente Demo',
  }),
}));

describe('ResenaForm', () => {
  it('exige calificacion y envia la resena del arriendo', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ResenaForm idArriendo={5} tipo="CLIENTE_A_VEHICULO" />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Calificar vehiculo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar resena/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '5 estrellas' }));
    await user.type(screen.getByLabelText(/comentario/i), 'Muy buen servicio');
    await user.click(screen.getByRole('button', { name: /enviar resena/i }));

    await waitFor(() => {
      expect(crearResena).toHaveBeenCalledWith({
        ID_arriendo: 5,
        tipo_resena: 'CLIENTE_A_VEHICULO',
        calificacion: 5,
        comentario: 'Muy buen servicio',
      });
    });
  });
});
