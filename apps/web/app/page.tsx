import Link from 'next/link';
import { Card } from '../components/ui/card';
import { StatusBadge } from '../components/ui/status-badge';

const foundations = [
  ['Typed API client', 'One response and error contract for every Express endpoint.'],
  ['Session boundary', 'JWT restoration, current-user refresh, sign-out, and route protection.'],
  ['Reusable states', 'Consistent loading, error, empty, form, card, and status components.'],
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute -right-28 -top-28 h-96 w-96 rounded-full border-[70px] border-mint/10" />
        <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1.25fr_.75fr]">
          <div className="relative z-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-mint">Step 10 · Frontend foundation</p>
            <h1 className="mt-7 max-w-4xl text-6xl font-black leading-[0.9] tracking-[-0.07em] sm:text-8xl lg:text-9xl">
              Share a seat.<br /><span className="text-mint">Split the fare.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-white/65">
              A clear interface foundation for passengers, drivers, and a three-seat Tesla moving through Dhaka traffic.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link className="rounded-full bg-mint px-6 py-3 text-sm font-black text-ink transition hover:bg-white" href="/login">
                Open sign-in foundation
              </Link>
              <Link className="rounded-full border border-white/20 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10" href="/dashboard">
                Test protected route
              </Link>
            </div>
          </div>
          <Card className="relative z-10 border-white/10 bg-white/5 text-white shadow-none backdrop-blur">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-mint">The Banani cast</p>
            <dl className="mt-6 divide-y divide-white/10">
              <div className="flex justify-between gap-5 py-4"><dt className="text-white/55">Passengers</dt><dd className="font-bold">Nusrat · Rafiq · Shirin</dd></div>
              <div className="flex justify-between gap-5 py-4"><dt className="text-white/55">Driver</dt><dd className="font-bold">Jashim</dd></div>
              <div className="flex justify-between gap-5 py-4"><dt className="text-white/55">Tesla</dt><dd className="font-bold">Bullet · 3 seats</dd></div>
              <div className="flex items-center justify-between gap-5 py-4"><dt className="text-white/55">Demo status</dt><dd><StatusBadge status="MATCHED" /></dd></div>
            </dl>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-leaf">Built before the screens</p>
          <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">A dependable UI layer, not disconnected pages.</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {foundations.map(([title, description], index) => (
            <Card key={title} className="shadow-none">
              <span className="text-sm font-black text-leaf">0{index + 1}</span>
              <h3 className="mt-8 text-xl font-black">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-ink/60">{description}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
