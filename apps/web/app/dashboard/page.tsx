'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../components/auth/protected-route';
import { LoadingState } from '../../components/ui/page-state';
import { useAuth } from '../../providers/auth-provider';

function RoleRedirect() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(user.role === 'DRIVER' ? '/driver' : '/passenger');
  }, [router, user]);

  return <LoadingState message="Opening your dashboard…" />;
}

export default function DashboardPage() {
  return <ProtectedRoute><RoleRedirect /></ProtectedRoute>;
}
