import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { VehiculoDetalle } from '../api';
import { VehiculoGaleria } from '../VehiculoGaleria';

const vehiculo = {
  id: 7,
  marca: 'Toyota',
  modelo: 'Corolla',
  tipoVehiculo: 'SEDAN',
  fotos: [
    {
      id: 1,
      url: '/uploads/vehiculos/7/foto-1.webp',
      thumbUrl: '/uploads/vehiculos/7/foto-1-thumb.webp',
      esPrincipal: true,
    },
    {
      id: 2,
      url: '/uploads/vehiculos/7/foto-2.webp',
      thumbUrl: '/uploads/vehiculos/7/foto-2-thumb.webp',
      esPrincipal: false,
    },
  ],
} as VehiculoDetalle;

describe('VehiculoGaleria', () => {
  it('cambia la foto principal con miniaturas y flechas', async () => {
    const user = userEvent.setup();
    render(<VehiculoGaleria vehiculo={vehiculo} />);

    expect(screen.getByRole('img', { name: 'Toyota Corolla, foto 1 de 2' })).toHaveAttribute(
      'src',
      'http://localhost:3000/uploads/vehiculos/7/foto-1.webp',
    );

    await user.click(screen.getByRole('button', { name: 'Ver foto 2' }));
    expect(screen.getByRole('img', { name: 'Toyota Corolla, foto 2 de 2' })).toHaveAttribute(
      'src',
      'http://localhost:3000/uploads/vehiculos/7/foto-2.webp',
    );

    await user.click(screen.getByRole('button', { name: 'Foto siguiente' }));
    expect(screen.getByRole('img', { name: 'Toyota Corolla, foto 1 de 2' })).toBeInTheDocument();
  });
});
