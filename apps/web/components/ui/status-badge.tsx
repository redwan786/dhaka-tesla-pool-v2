const styles: Record<string, string> = {
  REQUESTED: 'bg-amber-100 text-amber-900',
  MATCHED: 'bg-blue-100 text-blue-900',
  DRIVER_ARRIVED: 'bg-violet-100 text-violet-900',
  STARTED: 'bg-emerald-100 text-emerald-900',
  COMPLETED: 'bg-ink text-white',
  CANCELLED: 'bg-red-100 text-red-800',
  OPEN: 'bg-blue-100 text-blue-900',
  ARRIVED: 'bg-violet-100 text-violet-900',
  IN_PROGRESS: 'bg-emerald-100 text-emerald-900',
  ONLINE: 'bg-emerald-100 text-emerald-900',
  OFFLINE: 'bg-slate-200 text-slate-800',
  PASSENGER: 'bg-blue-100 text-blue-900',
  DRIVER: 'bg-violet-100 text-violet-900',
};

export function StatusBadge({ status }: { status: string }) {
  const label = status.replaceAll('_', ' ');
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold tracking-wide ${styles[status] ?? 'bg-ink/10 text-ink'}`}>
      {label}
    </span>
  );
}
