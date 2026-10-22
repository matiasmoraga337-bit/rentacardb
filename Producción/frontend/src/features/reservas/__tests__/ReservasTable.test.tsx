import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ReservasTable } from '../ReservasTable';
import type { Reserva } from '../api';

const reserva: Reserva = {
  id: 7,
  idCliente: 2,
  idSedeRetiro: 1,
  idSedeDevolucion: 1,
  fechaInicio: '2026-11-10',
  fechaFin: '2026-11-14',
  precioDia: 24990,
  porcentajeImpuesto: 19,
  subtotal: 99960,
  descuento: 0,
  impuesto: 18992.4,
  total: 118952.4,
  cliente: 'Cliente Demo',
  emailCliente: 'demo@rentacar.cl',
  vehiculoId: 1,
  patente: 'DEMOA01',
  modelo: 'Corolla',
  marca: 'Toyota',
  proveedorId: 1,
  proveedor: 'AutoDemo',
  sedeRetiro: 'Sede Santiago Centro',
  sedeDevolucion: 'Sede Providencia',
  estado: 'PENDIENTE',
  arriendoId: null,
  estadoArriendo: null,
  resenado: false,
  estadoPago: null,
  metodoPago: null,
  tipoOperacionPago: null,
  montoPago: null,
  fechaPago: null,
  fechaReserva: '2026-10-21T10:00:00',
  fechaExpiracion: '2026-10-21T10:30:00',
  observaciones: null,
};

describe('ReservasTable', () => {
  it('muestra una reserva y su enlace de detalle', () => {
    render(
      <MemoryRouter>
        <ReservasTable reservas={[reserva]} />
      </MemoryRouter>,
    );

    expect(screen.getByText('#7')).toBeInTheDocument();
    expect(screen.getByText('Toyota Corolla')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver detalle/i })).toHaveAttribute(
      'href',
      '/reservas/7',
    );
  });

  it('muestra un mensaje cuando no hay reservas', () => {
    render(
      <MemoryRouter>
        <ReservasTable reservas={[]} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/no hay reservas/i)).toBeInTheDocument();
  });
});
