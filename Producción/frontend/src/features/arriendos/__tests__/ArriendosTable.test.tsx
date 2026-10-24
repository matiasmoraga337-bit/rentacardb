import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ArriendosTable } from '../ArriendosTable';
import type { Arriendo } from '../api';

const arriendo: Arriendo = {
  id: 3,
  reservaId: 10,
  vehiculoId: 2,
  patente: 'DEMA01',
  marca: 'Toyota',
  modelo: 'Corolla',
  fechaInicio: '2026-11-10',
  fechaFin: '2026-11-14',
  fechaRetiro: '2026-11-10T10:00:00',
  fechaDevolucion: null,
  kmInicial: 28000,
  kmFinal: null,
  combustibleInicial: 100,
  combustibleFinal: null,
  estado: 'ACTIVO',
  estadoReserva: 'EN_CURSO',
  idSedeRetiro: 1,
  idSedeDevolucion: null,
  idSedeActual: 1,
  sedeRetiroReal: 'Sede Santiago Centro',
  sedeDevolucionReal: null,
  proveedorId: 1,
  proveedor: 'AutoDemo',
  clienteId: 2,
  cliente: 'Cliente Demo',
  emailCliente: 'demo@rentacar.cl',
};

describe('ArriendosTable', () => {
  it('muestra el arriendo y su enlace', () => {
    render(
      <MemoryRouter>
        <ArriendosTable arriendos={[arriendo]} mostrarCliente />
      </MemoryRouter>,
    );

    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getAllByText('Toyota Corolla')).toHaveLength(2);
    expect(screen.getAllByText('Activo')).toHaveLength(2);
    for (const link of screen.getAllByRole('link', { name: /ver detalle/i })) {
      expect(link).toHaveAttribute('href', '/arriendos/3');
    }
  });

  it('muestra un mensaje sin arriendos', () => {
    render(
      <MemoryRouter>
        <ArriendosTable arriendos={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no hay arriendos/i)).toBeInTheDocument();
  });
});
