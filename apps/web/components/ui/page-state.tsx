import { Button } from './button';
import { Card } from './card';

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="grid min-h-56 place-items-center" role="status" aria-live="polite">
      <div className="grid justify-items-center gap-3 text-center">
        <span className="h-9 w-9 animate-spin rounded-full border-4 border-leaf/20 border-t-leaf" />
        <p className="text-sm font-semibold text-ink/65">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="grid min-h-52 place-items-center border-dashed text-center shadow-none">
      <div className="max-w-md">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leaf">Nothing here yet</p>
        <h2 className="mt-3 text-2xl font-black tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/60">{description}</p>
      </div>
    </Card>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-red-200 bg-red-50 shadow-none" role="alert">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-700">Request failed</p>
      <h2 className="mt-2 text-xl font-black text-red-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-red-900/75">{message}</p>
      {onRetry ? <Button className="mt-5" variant="danger" onClick={onRetry}>Try again</Button> : null}
    </Card>
  );
}
