import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricCard } from '../MetricCard';

describe('MetricCard', () => {
  it('muestra titulo, valor y descripcion', () => {
    render(<MetricCard title="Reservas" value={12} description="Ultimos 30 dias" />);
    expect(screen.getByText('Reservas')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Ultimos 30 dias')).toBeInTheDocument();
  });
});
