import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EstadoArriendoBadge } from '../EstadoArriendoBadge';

describe('EstadoArriendoBadge', () => {
  it('muestra la etiqueta del estado', () => {
    render(<EstadoArriendoBadge estado="ACTIVO" />);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('muestra el estado desconocido sin romper', () => {
    render(<EstadoArriendoBadge estado="DESCONOCIDO" />);
    expect(screen.getByText('DESCONOCIDO')).toBeInTheDocument();
  });
});
