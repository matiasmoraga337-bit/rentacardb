import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  title: string;
  value: ReactNode;
  description?: string;
  icon?: LucideIcon;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  loading = false,
}: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="px-4 pb-2 pt-4 sm:p-6 sm:pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardDescription>{title}</CardDescription>
          {Icon && (
            <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand sm:grid">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>
        {loading ? (
          <Skeleton className="mt-1 h-8 w-20" />
        ) : (
          <CardTitle className="text-2xl tabular-nums sm:text-3xl">{value}</CardTitle>
        )}
      </CardHeader>
      {description && (
        <CardContent className="px-4 pb-4 pt-0 text-xs text-slate-500 sm:px-6 sm:pb-6">
          {description}
        </CardContent>
      )}
    </Card>
  );
}
