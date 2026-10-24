import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExploraPorRegion } from '../ExploraPorRegion';

vi.mock('../MapaChileRegiones', () => ({
  MapaChileRegiones: () => <div data-testid="mapa-chile" />,
}));

vi.mock('@/features/catalogos/hooks', () => ({
  useRegiones: () => ({
    data: [
      { id: 16, nombre: 'Región Metropolitana de Santiago' },
      { id: 5, nombre: 'Coquimbo' },
    ],
    isLoading: false,
    isError: false,
  }),
}));

describe('ExploraPorRegion', () => {
  it('selecciona una region desde el selector', async () => {
    const onSeleccionar = vi.fn();
    const user = userEvent.setup();

    render(<ExploraPorRegion onSeleccionar={onSeleccionar} />);

    await user.selectOptions(screen.getByLabelText('Región'), '16');

    expect(onSeleccionar).toHaveBeenCalledWith(16);
  });
});
