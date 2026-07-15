interface StateMessageProps {
  title: string;
  message: string;
}

export function StateMessage({ title, message }: StateMessageProps) {
  return (
    <div className="panel flex min-h-72 items-center justify-center text-center">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
      </div>
    </div>
  );
}
