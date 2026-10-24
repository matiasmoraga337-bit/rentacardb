import type { FormEvent } from 'react';
import { Search } from 'lucide-react';
import { ComunaCombobox } from '@/components/forms/ComunaCombobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CatalogoHeroProps {
  fechaInicio: string;
  fechaFin: string;
  idComuna?: number;
  onFechaInicio: (value: string) => void;
  onFechaFin: (value: string) => void;
  onComuna: (value: number | undefined) => void;
  onBuscar: () => void;
}

export function CatalogoHero({
  fechaInicio,
  fechaFin,
  idComuna,
  onFechaInicio,
  onFechaFin,
  onComuna,
  onBuscar,
}: CatalogoHeroProps) {
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onBuscar();
  };

  return (
    <section className="relative overflow-hidden bg-teal-950 text-white">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(94,234,212,0.28),transparent_34%),radial-gradient(circle_at_82%_0%,rgba(20,184,166,0.32),transparent_38%),linear-gradient(120deg,#042f2e_0%,#115e59_48%,#0f766e_100%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.32))]"
        aria-hidden="true"
      />
      <img
        src="/images/hero-car.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 right-0 hidden w-[500px] opacity-80 xl:block"
      />
      <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">
          RentaCarDB
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Encuentra el auto ideal para tu próximo viaje por Chile
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-teal-100 sm:text-base">
          Compara precio, sede y proveedor en un solo lugar. Elige tus fechas y revisa
          disponibilidad real.
        </p>

        <form
          onSubmit={submit}
          className="mt-7 grid gap-3 rounded-2xl border border-white/20 bg-white/95 p-3 text-slate-900 shadow-2xl shadow-teal-950/30 backdrop-blur sm:p-4 lg:grid-cols-[1.25fr_1fr_1fr_auto] lg:items-end"
        >
          <ComunaCombobox value={idComuna} onChange={onComuna} />
          <div className="space-y-1">
            <Label htmlFor="hero-desde">Desde</Label>
            <Input
              id="hero-desde"
              type="date"
              value={fechaInicio}
              onChange={(event) => onFechaInicio(event.target.value)}
              className="h-11 rounded-lg"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="hero-hasta">Hasta</Label>
            <Input
              id="hero-hasta"
              type="date"
              value={fechaFin}
              onChange={(event) => onFechaFin(event.target.value)}
              className="h-11 rounded-lg"
            />
          </div>
          <Button type="submit" size="lg" className="h-11 w-full lg:w-auto">
            <Search className="h-4 w-4" aria-hidden="true" />
            Buscar
          </Button>
        </form>
      </div>
    </section>
  );
}
