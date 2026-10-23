import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RatingStars, formatRating } from '../rating-stars';

describe('RatingStars', () => {
  it('expone la calificacion accesible', () => {
    render(<RatingStars value={4.7} />);
    expect(screen.getByRole('img', { name: '4,7 de 5 estrellas' })).toBeInTheDocument();
  });

  it('muestra estrellas vacias sin calificacion', () => {
    const { container } = render(<RatingStars value={null} />);
    expect(screen.getByRole('img', { name: 'Sin calificacion' })).toBeInTheDocument();
    expect(container.querySelector('span[style]')).toHaveStyle({ width: '0%' });
  });

  it('limita valores fuera de rango', () => {
    render(<RatingStars value={8} />);
    expect(screen.getByRole('img', { name: '5 de 5 estrellas' })).toBeInTheDocument();
  });

  it('formatea numeros enteros y decimales', () => {
    expect(formatRating(5)).toBe('5');
    expect(formatRating(4.7)).toBe('4,7');
  });
});
