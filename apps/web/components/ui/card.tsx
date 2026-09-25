import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-3xl border border-ink/10 bg-white p-6 shadow-card ${className}`}
      {...props}
    />
  );
}
