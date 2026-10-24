import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ExploraPorRegion', () => {
  it('selecciona una region desde el selector', async () => {
    const onSeleccionar = vi.fn();
    const user = userEvent.setup();

    render(<ExploraPorRegion onSeleccionar={onSeleccionar} />);

    await user.selectOptions(screen.getByLabelText('Región'), '16');

    expect(onSeleccionar).toHaveBeenCalledWith(16);
  });

  it('no monta el mapa en mobile', () => {
    render(<ExploraPorRegion onSeleccionar={vi.fn()} />);

    expect(screen.queryByTestId('mapa-chile')).not.toBeInTheDocument();
  });

  it('monta el mapa en desktop', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(min-width: 1024px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    render(<ExploraPorRegion onSeleccionar={vi.fn()} />);

    expect(screen.getByTestId('mapa-chile')).toBeInTheDocument();
  });
});
