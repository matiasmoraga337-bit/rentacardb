import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { BusquedaItem } from '../api';
import { imagenVehiculo } from '../images';
import { VehiculoCard } from '../VehiculoCard';

vi.mock('@/features/favoritos/FavoritoButton', () => ({
  FavoritoButton: () => <button type="button">Favorito</button>,
}));

const item: BusquedaItem = {
  ID_vehiculo: 7,
  patente_vehiculo: 'TEST07',
  precio_diario_base_vehiculo: 24990,
  precio_cotizado: 24990,
  calificacion_promedio_vehiculo: 4.5,
  anio_vehiculo: 2024,
  nombre_marca: 'Toyota',
  nombre_modelo: 'Corolla',
  nombre_tipo_vehiculo: 'Sedan',
  nombre_sede_proveedor: 'Sede Centro',
  nombre_comuna: 'Santiago',
  nombre_region: 'Metropolitana',
  nombre_comercial_proveedor: 'AutoDemo',
};

describe('VehiculoCard', () => {
  it('muestra la imagen por categoria, el precio y la calificacion', () => {
    render(
      <MemoryRouter>
        <VehiculoCard item={item} desde="2026-11-01" hasta="2026-11-05" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/catalogo/7?desde=2026-11-01&hasta=2026-11-05',
    );
    expect(screen.getByRole('img', { name: 'Imagen referencial de Toyota Corolla' })).toHaveAttribute(
      'src',
      '/images/vehiculos/sedan.svg',
    );
    expect(screen.getByText('$24.990')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '4,5 de 5 estrellas' })).toBeInTheDocument();
  });

  it('usa la foto principal cuando existe', () => {
    render(
      <MemoryRouter>
        <VehiculoCard
          item={{ ...item, url_foto_principal_thumb: '/uploads/vehiculos/7/thumb.webp' }}
          desde=""
          hasta=""
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: 'Toyota Corolla' })).toHaveAttribute(
      'src',
      'http://localhost:3000/uploads/vehiculos/7/thumb.webp',
    );
  });

  it('muestra sin resenas cuando no hay calificacion', () => {
    render(
      <MemoryRouter>
        <VehiculoCard
          item={{ ...item, calificacion_promedio_vehiculo: null }}
          desde=""
          hasta=""
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Sin reseñas')).toBeInTheDocument();
  });

  it('elige placeholder por tipo de vehiculo', () => {
    expect(imagenVehiculo('SUV')).toBe('/images/vehiculos/suv.svg');
    expect(imagenVehiculo('Citycar')).toBe('/images/vehiculos/citycar.svg');
    expect(imagenVehiculo('Camioneta')).toBe('/images/vehiculos/default.svg');
    expect(imagenVehiculo('Desconocido')).toBe('/images/vehiculos/default.svg');
  });
});
