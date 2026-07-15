import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  contentClassName?: string;
  action?: ReactNode;
}

export function ChartCard({ title, subtitle, children, contentClassName, action }: ChartCardProps) {
  return (
    <section className="panel">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {subtitle ? <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={contentClassName ?? 'h-72'}>{children}</div>
    </section>
  );
}
