const PLACEHOLDERS = [
  { pattern: /suv|4x4/i, file: 'suv.svg' },
  { pattern: /sedan|sedán/i, file: 'sedan.svg' },
  { pattern: /city|hatch|compacto|economico|económico/i, file: 'citycar.svg' },
  { pattern: /camioneta|pickup/i, file: 'default.svg' },
];

export function imagenVehiculo(nombreTipo: string | null | undefined): string {
  const match = PLACEHOLDERS.find(({ pattern }) => pattern.test(nombreTipo ?? ''));
  return `/images/vehiculos/${match?.file ?? 'default.svg'}`;
}
