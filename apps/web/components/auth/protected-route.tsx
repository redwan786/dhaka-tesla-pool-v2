'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { UserRole } from '../../lib/auth/types';
import { useAuth } from '../../providers/auth-provider';
import { ErrorState, LoadingState } from '../ui/page-state';

export function ProtectedRoute({
  children,
  allowedRoles,
}: Readonly<{ children: React.ReactNode; allowedRoles?: UserRole[] }>) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isLoading, pathname, router, user]);

  if (isLoading || !user) return <LoadingState message="Checking your session…" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <ErrorState title="Access denied" message="Your account role cannot open this page." />;
  }

  return children;
}
