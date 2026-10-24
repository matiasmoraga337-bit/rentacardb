import type { BusquedaItem } from '../api';

const base: BusquedaItem = {
  ID_vehiculo: 1,
  patente_vehiculo: 'DEMA01',
  precio_diario_base_vehiculo: 24990,
  precio_cotizado: 24990,
  calificacion_promedio_vehiculo: 5,
  anio_vehiculo: 2023,
  nombre_marca: 'Toyota',
  nombre_modelo: 'Corolla',
  nombre_tipo_vehiculo: 'Sedan',
  nombre_sede_proveedor: 'Sede Santiago Centro',
  nombre_comuna: 'Santiago',
  nombre_region: 'Metropolitana',
  nombre_comercial_proveedor: 'AutoDemo',
  dias: 4,
};

export const vehiculosWorstCase: BusquedaItem[] = [
  {
    ...base,
    ID_vehiculo: 101,
    patente_vehiculo: 'ABCD12',
    nombre_marca: 'Mercedes-Benz',
    nombre_modelo: 'Clase GLS 450 4MATIC AMG Line',
    nombre_tipo_vehiculo: 'SUV',
    nombre_comercial_proveedor:
      'Rentas y Servicios Automotrices del Pacífico Sur Limitada',
    nombre_comuna: 'San Pedro de la Paz',
    nombre_region: 'Biobío',
    precio_diario_base_vehiculo: 189990,
    precio_cotizado: 189990,
  },
  {
    ...base,
    ID_vehiculo: 102,
    patente_vehiculo: 'WXYZ99',
    nombre_marca: 'Škoda',
    nombre_modelo: 'Superb Combi Sportline 2.0 TSI',
    nombre_comercial_proveedor: 'Jo',
    nombre_comuna: 'Ñuñoa',
    nombre_region: 'Metropolitana',
    precio_diario_base_vehiculo: 74990,
    precio_cotizado: 74990,
  },
  {
    ...base,
    ID_vehiculo: 103,
    patente_vehiculo: 'TEST01',
    nombre_marca: '🚗 Eléctricos del Sur',
    nombre_modelo: 'Modelo con un nombre extraordinariamente largo para probar el truncado',
    nombre_tipo_vehiculo: 'Citycar',
    nombre_comercial_proveedor: 'bartholomew.fitzgerald@northwind-industries-holdings.example.com',
    nombre_comuna: 'Padre Las Casas',
    nombre_region: 'La Araucanía',
    precio_diario_base_vehiculo: 99999999.99,
    precio_cotizado: 12345678.9,
  },
  {
    ...base,
    ID_vehiculo: 104,
    patente_vehiculo: 'UNO1',
    nombre_marca: 'Kia',
    nombre_modelo: 'Rio',
    nombre_comercial_proveedor: 'Proveedor',
    nombre_comuna: 'Iquique',
    nombre_region: 'Tarapacá',
    precio_diario_base_vehiculo: 1,
    precio_cotizado: 1,
    calificacion_promedio_vehiculo: 1,
  },
  {
    ...base,
    ID_vehiculo: 105,
    patente_vehiculo: 'SINCOMUNA',
    nombre_marca: 'Sin sede',
    nombre_modelo: 'Vehiculo sin comuna',
    nombre_sede_proveedor: null,
    nombre_comuna: null,
    nombre_region: null,
    nombre_comercial_proveedor: 'Proveedor sin sede',
    nombre_tipo_vehiculo: 'Camioneta',
    calificacion_promedio_vehiculo: null,
  },
  {
    ...base,
    ID_vehiculo: 106,
    patente_vehiculo: 'RTL123',
    nombre_marca: 'تويوتا',
    nombre_modelo: 'كامري',
    nombre_comercial_proveedor: 'Proveedor Árabe',
    nombre_comuna: 'Providencia',
    nombre_region: 'Metropolitana',
  },
];

export function vehiculosFixture(mode: string): BusquedaItem[] {
  if (mode === 'empty') return [];
  if (mode === 'one') return [base];
  if (mode === 'many') {
    return Array.from({ length: 1000 }, (_, index) => ({
      ...base,
      ID_vehiculo: 1000 + index,
      patente_vehiculo: `M${String(index).padStart(3, '0')}AA`,
      precio_cotizado: 20000 + index * 10,
      nombre_comercial_proveedor:
        index % 3 === 0
          ? 'Rentas y Servicios Automotrices del Pacífico Sur Limitada'
          : base.nombre_comercial_proveedor,
    }));
  }
  return vehiculosWorstCase;
}
