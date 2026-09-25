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

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await apiRequest<AuthResult>('/auth/register', {
        method: 'POST',
        body: { name, email, password },
      });
      setSession(result);
      router.replace('/passenger');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Passenger registration"
      title="Start with a route, not a complicated account."
      description="Public registration creates passenger accounts only. Driver identities and vehicles are provisioned separately."
      footer={<>Already registered? <Link className="font-bold text-leaf" href="/login">Sign in</Link></>}
    >
      <h2 className="text-2xl font-black">Create passenger account</h2>
      <p className="mt-2 text-sm text-ink/60">Your role is fixed securely by the API.</p>
      {error ? <div className="mt-6"><Notice tone="error" title="Registration failed" message={error} /></div> : null}
      <form className="mt-7 grid gap-5" onSubmit={submit}>
        <FieldShell label="Full name" htmlFor="name">
          <TextInput id="name" autoComplete="name" minLength={2} maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} />
        </FieldShell>
        <FieldShell label="Email address" htmlFor="email">
          <TextInput id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </FieldShell>
        <FieldShell label="Password" htmlFor="password" hint="8–72 characters with at least one letter and one number.">
          <TextInput id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </FieldShell>
        <Button className="w-full" type="submit" isLoading={isSubmitting}>Create account</Button>
      </form>
    </AuthShell>
  );
}
