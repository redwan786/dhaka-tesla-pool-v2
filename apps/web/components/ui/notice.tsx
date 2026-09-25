type NoticeProps = {
  tone?: 'success' | 'error' | 'info';
  title: string;
  message?: string;
};

const tones = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  error: 'border-red-200 bg-red-50 text-red-950',
  info: 'border-blue-200 bg-blue-50 text-blue-950',
};

export function Notice({ tone = 'info', title, message }: NoticeProps) {
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`} role={tone === 'error' ? 'alert' : 'status'}>
      <p className="text-sm font-extrabold">{title}</p>
      {message ? <p className="mt-1 text-sm opacity-75">{message}</p> : null}
    </div>
  );
}
