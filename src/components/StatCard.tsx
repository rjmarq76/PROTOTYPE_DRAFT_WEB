import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, detail, icon: Icon }: StatCardProps) {
  return (
    <article className="panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
        <div className="rounded-lg bg-blue-50 p-2 text-azure dark:bg-blue-950/60">
          <Icon size={20} />
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  );
}
