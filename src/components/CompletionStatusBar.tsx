import { CheckCircle2 } from 'lucide-react';
import { getCompletionStyle } from '../utils/analytics';

interface CompletionStatusBarProps {
  completed: number;
  total: number;
  className?: string;
}

/**
 * Shows a user's completion status for evaluating companies in a category:
 * - No companies registered: neutral "No Partner Companies" text.
 * - Not started (0 completed): "Not Yet Started" text only, no bar.
 * - Fully completed: bar disappears, replaced with a "Completed" badge.
 * - In progress: a colored bar + percentage, color varies by completion band.
 */
export function CompletionStatusBar({ completed, total, className = '' }: CompletionStatusBarProps) {
  const style = getCompletionStyle(completed, total);

  if (style.status === 'no-companies') {
    return (
      <div className={className}>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">No Partner Companies</span>
      </div>
    );
  }

  if (style.status === 'not-started') {
    return (
      <div className={className}>
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Not Yet Started</span>
      </div>
    );
  }

  if (style.status === 'completed') {
    return (
      <div className={className}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-1 text-xs font-bold">
          <CheckCircle2 size={13} />
          <span>Survey Completed</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-1 min-w-[120px] ${className}`}>
      <div className="flex items-center justify-between text-[10px] font-semibold">
        <span className={style.textColorClass}>{completed} / {total} companies</span>
        <span className={`font-bold ${style.textColorClass}`}>{style.percentage}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${style.barColorClass}`}
          style={{ width: `${style.percentage}%` }}
        />
      </div>
    </div>
  );
}
