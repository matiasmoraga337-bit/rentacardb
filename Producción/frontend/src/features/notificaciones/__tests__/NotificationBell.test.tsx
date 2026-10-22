import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { NotificationBell } from '../NotificationBell';

vi.mock('../api', () => ({
  fetchNoLeidas: vi.fn().mockResolvedValue({ total: 3 }),
}));

describe('NotificationBell', () => {
  it('muestra el contador de no leidas', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <NotificationBell />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByLabelText('Notificaciones: 3 sin leer')).toBeInTheDocument();
  });
});
