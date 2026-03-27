import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm card-interactive", className)}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums stat-value">
            {value}
          </div>
          <div className="text-sm text-muted-foreground mt-1">{label}</div>
        </div>
        {icon && (
          <div className="text-muted-foreground transition-colors duration-200 group-hover:text-primary" aria-hidden="true">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
