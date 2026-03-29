import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tooltip?: string;
  className?: string;
}

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <div className={cn("border-2 border-foreground bg-card p-4 sm:p-6", className)}>
      <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
