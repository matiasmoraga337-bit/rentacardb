export function esFechaValida(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [anio, mes, dia] = value.split('-').map(Number);
  const date = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    date.getUTCFullYear() === anio &&
    date.getUTCMonth() === mes - 1 &&
    date.getUTCDate() === dia
  );
}

export function hoyIsoLocal(): string {
  const now = new Date();
  const mes = String(now.getMonth() + 1).padStart(2, '0');
  const dia = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mes}-${dia}`;
}
