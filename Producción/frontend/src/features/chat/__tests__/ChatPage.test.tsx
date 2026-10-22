import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ChatPage } from '../ChatPage';

vi.mock('../api', () => ({
  fetchConversaciones: vi.fn().mockResolvedValue([
    {
      id: 1,
      idUsuario: 2,
      idProveedor: 1,
      proveedor: 'AutoDemo',
      idVehiculo: 2,
      activa: true,
      fechaInicio: '2026-10-22T10:00:00',
      fechaUltimoMensaje: '2026-10-22T10:05:00',
      noLeidos: 0,
      ultimoMensaje: 'Hola',
    },
  ]),
  fetchMensajes: vi.fn().mockResolvedValue([
    {
      id: 1,
      conversacionId: 1,
      idEmisor: 2,
      contenido: 'Hola, consulta por el vehiculo.',
      leido: true,
      fecha: '2026-10-22T10:05:00',
    },
  ]),
  marcarLeidos: vi.fn().mockResolvedValue({ mensajesMarcados: 0 }),
  enviarMensaje: vi.fn(),
  cerrarConversacion: vi.fn(),
}));

describe('ChatPage', () => {
  it('muestra la conversacion y sus mensajes', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/chat/1']}>
            <Routes>
              <Route path="/chat/:id" element={<ChatPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );

    expect((await screen.findAllByText('AutoDemo')).length).toBeGreaterThan(0);
    expect(await screen.findByText('Hola, consulta por el vehiculo.')).toBeInTheDocument();
  });
});
