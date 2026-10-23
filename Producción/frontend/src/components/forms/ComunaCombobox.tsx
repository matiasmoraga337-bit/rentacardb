import { useEffect, useId, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useBuscarComunas } from '@/features/catalogos/hooks';
import { cn } from '@/lib/utils';

interface ComunaComboboxProps {
  value?: number;
  onChange: (id: number | undefined) => void;
  label?: string;
  placeholder?: string;
}

export function ComunaCombobox({
  value,
  onChange,
  label = 'Destino',
  placeholder = 'Comuna o ciudad',
}: ComunaComboboxProps) {
  const listId = useId();
  const [texto, setTexto] = useState('');
  const [debounced, setDebounced] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(texto.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [texto]);

  const comunas = useBuscarComunas(debounced);
  const resultados = comunas.data ?? [];
  const mostrarLista = abierto && debounced.length >= 2;

  const seleccionar = (id: number, nombre: string): void => {
    setTexto(nombre);
    onChange(id);
    setAbierto(false);
    setActivo(0);
  };

  return (
    <div className="space-y-1">
      <Label htmlFor={`${listId}-input`}>{label}</Label>
      <div className="relative">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id={`${listId}-input`}
          role="combobox"
          aria-expanded={mostrarLista}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            mostrarLista && resultados[activo] ? `${listId}-${resultados[activo].id}` : undefined
          }
          autoComplete="off"
          value={texto}
          placeholder={placeholder}
          onChange={(event) => {
            setTexto(event.target.value);
            setAbierto(true);
            setActivo(0);
            onChange(undefined);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => window.setTimeout(() => setAbierto(false), 150)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setAbierto(false);
              return;
            }
            if (!mostrarLista) return;
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActivo((current) => Math.min(current + 1, resultados.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActivo((current) => Math.max(current - 1, 0));
            } else if (event.key === 'Enter' && resultados[activo]) {
              event.preventDefault();
              seleccionar(resultados[activo].id, resultados[activo].nombre);
            }
          }}
          className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-base text-slate-900 shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30 sm:text-sm"
        />
        {texto && (
          <button
            type="button"
            aria-label="Limpiar destino"
            onClick={() => {
              setTexto('');
              setDebounced('');
              setAbierto(false);
              onChange(undefined);
            }}
            className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {mostrarLista && (
          <ul
            id={listId}
            role="listbox"
            aria-label="Comunas"
            className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          >
            {comunas.isLoading && (
              <li className="px-3 py-2 text-sm text-slate-500">Buscando…</li>
            )}
            {!comunas.isLoading && resultados.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500">Sin comunas.</li>
            )}
            {resultados.map((comuna, index) => (
              <li
                key={comuna.id}
                id={`${listId}-${comuna.id}`}
                role="option"
                aria-selected={value === comuna.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => seleccionar(comuna.id, comuna.nombre)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm',
                  index === activo ? 'bg-brand/10 text-brand' : 'text-slate-700 hover:bg-slate-100',
                )}
              >
                <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{comuna.nombre}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
