import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EstadoReservaBadge } from '../EstadoReservaBadge';

describe('EstadoReservaBadge', () => {
  it('muestra la etiqueta en español del estado', () => {
    render(<EstadoReservaBadge estado="CONFIRMADA" />);
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
  });

  it('muestra un estado desconocido sin romper', () => {
    render(<EstadoReservaBadge estado="DESCONOCIDO" />);
    expect(screen.getByText('DESCONOCIDO')).toBeInTheDocument();
  });
});
