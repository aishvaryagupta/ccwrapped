import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tooltip?: string;
  className?: string;
}

export function StatCard({ label, value, icon, tooltip, className }: StatCardProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm card-interactive", className)}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums stat-value">
            {value}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-sm text-muted-foreground">{label}</span>
            {tooltip && (
              <span title={tooltip} className="text-muted-foreground/50 hover:text-muted-foreground cursor-help transition-colors">
                <Info className="size-3.5" />
              </span>
            )}
          </div>
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
