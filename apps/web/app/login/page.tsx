'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '../../components/auth/auth-shell';
import { Button } from '../../components/ui/button';
import { FieldShell, TextInput } from '../../components/ui/form-controls';
import { Notice } from '../../components/ui/notice';
import { apiRequest } from '../../lib/api/client';
import type { AuthResult } from '../../lib/auth/types';
import { errorMessage } from '../../lib/format';
import { useAuth } from '../../providers/auth-provider';

const DEMO_ACCOUNTS = [
  { label: 'Nusrat · Passenger', email: 'nusrat@teslapool.local' },
  { label: 'Jashim · Driver', email: 'jashim@teslapool.local' },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState('nusrat@teslapool.local');
  const [password, setPassword] = useState('Pass123!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (loginEmail: string, loginPassword: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await apiRequest<AuthResult>('/auth/login', {
        method: 'POST',
        body: { email: loginEmail, password: loginPassword },
      });
      setSession(result);
      router.replace(result.user.role === 'DRIVER' ? '/driver' : '/passenger');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void signIn(email, password);
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Your seat—or your Tesla—is waiting."
      description="Sign in as a passenger to request and track a ride, or as Jashim to manage Bullet's pool lifecycle."
      footer={<>Need an account? <Link className="font-bold text-leaf" href="/register">Register as a passenger</Link></>}
    >
      <div>
        <h2 className="text-2xl font-black">Sign in</h2>
        <p className="mt-2 text-sm text-ink/60">Use your account or a seeded demo identity.</p>
      </div>
      {error ? <div className="mt-6"><Notice tone="error" title="Sign-in failed" message={error} /></div> : null}
      <form className="mt-7 grid gap-5" onSubmit={submit}>
        <FieldShell label="Email address" htmlFor="email">
          <TextInput id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </FieldShell>
        <FieldShell label="Password" htmlFor="password">
          <TextInput id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </FieldShell>
        <Button className="w-full" type="submit" isLoading={isSubmitting}>Sign in</Button>
      </form>
      <div className="mt-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ink/45">Quick demo</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.email}
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => {
                setEmail(account.email);
                setPassword('Pass123!');
                void signIn(account.email, 'Pass123!');
              }}
            >
              {account.label}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink/45">Demo password: Pass123!</p>
      </div>
    </AuthShell>
  );
}
