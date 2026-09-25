'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/auth-provider';
import { Button } from '../ui/button';

export function SiteHeader() {
  const { user, isLoading, clearSession } = useAuth();
  const router = useRouter();

  const signOut = () => {
    clearSession();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link className="flex items-center gap-3 font-black tracking-tight text-ink" href="/">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-ink text-sm text-mint">DTP</span>
          <span className="hidden sm:inline">Dhaka Tesla Pool</span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Primary navigation">
          <Link className="rounded-full px-4 py-2 text-sm font-bold text-ink/70 hover:bg-white hover:text-ink" href="/">
            Home
          </Link>
          {!isLoading && user ? (
            <>
              <Link className="rounded-full px-4 py-2 text-sm font-bold text-ink/70 hover:bg-white hover:text-ink" href="/dashboard">
                Dashboard
              </Link>
              <Button variant="secondary" onClick={signOut}>Sign out</Button>
            </>
          ) : null}
          {!isLoading && !user ? (
            <Link className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-leaf" href="/login">
              Sign in
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
