import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TableSkeleton } from '../table-skeleton';

describe('TableSkeleton', () => {
  it('expone un estado de carga accesible', () => {
    render(<TableSkeleton rows={3} />);
    expect(screen.getByRole('status', { name: 'Cargando' })).toBeInTheDocument();
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
  });
});
