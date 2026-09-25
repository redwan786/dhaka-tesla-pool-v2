import Link from 'next/link';

export function AuthShell({
  eyebrow,
  title,
  description,
  footer,
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <main className="page-container grid min-h-[calc(100vh-4rem)] items-center py-10">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-4xl border border-ink/10 bg-white shadow-card lg:grid-cols-[.85fr_1.15fr]">
        <section className="relative overflow-hidden bg-ink p-8 text-white sm:p-12">
          <span className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[52px] border-mint/10" />
          <p className="relative text-xs font-extrabold uppercase tracking-[0.22em] text-mint">{eyebrow}</p>
          <h1 className="relative mt-6 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="relative mt-5 max-w-md text-sm leading-7 text-white/60">{description}</p>
          <div className="relative mt-12 border-t border-white/10 pt-6 text-sm text-white/60">
            Jashim · Bullet · Nusrat · Rafiq · Shirin
          </div>
        </section>
        <section className="p-8 sm:p-12">
          {children}
          <div className="mt-8 border-t border-ink/10 pt-6 text-center text-sm text-ink/60">{footer}</div>
          <Link href="/" className="mx-auto mt-4 block w-fit text-sm font-bold text-leaf hover:text-ink">← Back home</Link>
        </section>
      </div>
    </main>
  );
}
