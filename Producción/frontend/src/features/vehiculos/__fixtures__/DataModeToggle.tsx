const MODES = [
  { value: 'demo', label: 'Demo' },
  { value: 'worst', label: 'Worst case' },
  { value: 'empty', label: 'Empty' },
  { value: 'one', label: 'One' },
  { value: 'many', label: '1.000' },
];

export function DataModeToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <nav
      aria-label="Datos de prueba"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-300 bg-white/95 p-1 text-xs shadow-lg backdrop-blur"
    >
      {MODES.map((mode) => (
        <button
          key={mode.value}
          type="button"
          aria-pressed={value === mode.value}
          onClick={() => onChange(mode.value)}
          className={
            value === mode.value
              ? 'rounded-full bg-slate-900 px-3 py-1.5 font-medium text-white'
              : 'rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100'
          }
        >
          {mode.label}
        </button>
      ))}
    </nav>
  );
}
