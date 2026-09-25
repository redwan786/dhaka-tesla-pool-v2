import Link from 'next/link';
import { Card } from '../../components/ui/card';
import { EmptyState } from '../../components/ui/page-state';

export default function LoginFoundationPage() {
  return (
    <main className="page-container grid min-h-[calc(100vh-4rem)] items-center py-12">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[.8fr_1.2fr]">
        <Card className="bg-ink text-white">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-mint">Authentication boundary</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight">One session. Two focused experiences.</h1>
          <p className="mt-5 text-sm leading-7 text-white/60">
            The shared auth provider restores JWT sessions and will direct passengers and drivers to their own flows in Step 11.
          </p>
          <Link className="mt-8 inline-flex text-sm font-bold text-mint hover:text-white" href="/">← Return home</Link>
        </Card>
        <EmptyState
          title="Sign-in form arrives in Step 11"
          description="This route intentionally proves the public navigation and auth boundary without implementing the product screen ahead of its feature branch."
        />
      </div>
    </main>
  );
}
