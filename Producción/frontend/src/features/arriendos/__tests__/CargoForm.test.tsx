import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { registrarCargoExtra } from '../api';
import { CargoForm } from '../CargoForm';

vi.mock('../api', () => ({
  registrarCargoExtra: vi.fn().mockResolvedValue({ ID_cargo_extra: 1 }),
}));

describe('CargoForm', () => {
  it('envia concepto, tipo y monto', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <CargoForm idArriendo={5} />
      </QueryClientProvider>,
    );

    expect(screen.getByRole('button', { name: /registrar cargo/i })).toBeDisabled();

    await user.type(screen.getByLabelText('Concepto'), 'Limpieza especial');
    await user.selectOptions(screen.getByLabelText('Tipo'), 'LIMPIEZA');
    await user.type(screen.getByLabelText('Monto (CLP)'), '12000');
    await user.click(screen.getByRole('button', { name: /registrar cargo/i }));

    await waitFor(() => {
      expect(registrarCargoExtra).toHaveBeenCalledWith(5, {
        concepto: 'Limpieza especial',
        monto: 12000,
        tipo_cargo: 'LIMPIEZA',
        observaciones: undefined,
      });
    });
  });
});
