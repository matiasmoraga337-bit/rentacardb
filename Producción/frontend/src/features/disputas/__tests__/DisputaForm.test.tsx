import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { crearDisputa } from '../api';
import { DisputaForm } from '../DisputaForm';

vi.mock('../api', () => ({
  crearDisputa: vi.fn().mockResolvedValue({ id: 1 }),
  ETIQUETAS_DISPUTA: {
    DANO: 'Dano',
    COBRO: 'Cobro',
    SERVICIO: 'Servicio',
    DOCUMENTO: 'Documento',
    OTRO: 'Otro',
  },
}));

describe('DisputaForm', () => {
  it('exige una descripcion minima y envia la disputa', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <DisputaForm idArriendo={7} />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('button', { name: /abrir disputa/i })).toBeDisabled();

    await user.selectOptions(screen.getByLabelText('Tipo'), 'COBRO');
    await user.type(screen.getByLabelText('Monto disputado (CLP)'), '25000');
    await user.type(
      screen.getByLabelText('Descripcion'),
      'Cobro no reconocido por el cliente',
    );
    await user.click(screen.getByRole('button', { name: /abrir disputa/i }));

    await waitFor(() => {
      expect(crearDisputa).toHaveBeenCalledWith({
        ID_arriendo: 7,
        tipo_disputa: 'COBRO',
        descripcion: 'Cobro no reconocido por el cliente',
        monto_disputado: 25000,
      });
    });
  });
});
