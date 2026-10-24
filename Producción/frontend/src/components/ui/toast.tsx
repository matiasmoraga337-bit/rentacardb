import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

const iconByVariant = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const stylesByVariant = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
};

const iconStylesByVariant = {
  success: 'text-emerald-600',
  error: 'text-red-600',
  info: 'text-sky-600',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success', description?: string) => {
      const id = (nextId.current += 1);
      setToasts((current) => [...current, { id, message, description, variant }]);
      const timer = window.setTimeout(
        () => dismiss(id),
        variant === 'error' ? 6000 : 4500,
      );
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => window.clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const Icon = iconByVariant[toast.variant];
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-xl',
                stylesByVariant[toast.variant],
              )}
            >
              <Icon
                className={cn('mt-0.5 h-5 w-5 shrink-0', iconStylesByVariant[toast.variant])}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{toast.message}</p>
                {toast.description && (
                  <p className="mt-0.5 text-xs opacity-80">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                aria-label="Cerrar notificación"
                onClick={() => dismiss(toast.id)}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full opacity-60 hover:bg-black/5 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
