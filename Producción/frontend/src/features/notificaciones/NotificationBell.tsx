import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchNoLeidas } from './api';

export function NotificationBell() {
  const query = useQuery({
    queryKey: ['notificaciones-no-leidas'],
    queryFn: fetchNoLeidas,
    refetchInterval: 30000,
  });
  const total = query.data?.total ?? 0;

  return (
    <Link
      to="/notificaciones"
      className="relative inline-flex items-center text-slate-600 hover:text-brand"
      aria-label={total > 0 ? `Notificaciones: ${total} sin leer` : 'Notificaciones'}
    >
      <Bell className="h-5 w-5" />
      {total > 0 && (
        <span className="absolute -right-2 -top-2 min-w-4 rounded-full bg-brand px-1 text-center text-[10px] font-semibold leading-4 text-white">
          {total > 9 ? '9+' : total}
        </span>
      )}
    </Link>
  );
}
