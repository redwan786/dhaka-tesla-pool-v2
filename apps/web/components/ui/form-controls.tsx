import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

type FieldShellProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

export function FieldShell({ label, htmlFor, error, hint, children }: FieldShellProps) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-bold text-ink" htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      {!error && hint ? <p className="text-sm text-ink/60">{hint}</p> : null}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`min-h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-ink outline-none transition placeholder:text-ink/35 focus:border-leaf focus:ring-4 focus:ring-leaf/10 ${className}`}
        {...props}
      />
    );
  },
);

export const SelectInput = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function SelectInput({ className = '', children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={`min-h-12 w-full rounded-2xl border border-ink/15 bg-white px-4 text-ink outline-none transition focus:border-leaf focus:ring-4 focus:ring-leaf/10 ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  },
);
