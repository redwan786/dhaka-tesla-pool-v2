'use client';

import { ProtectedRoute } from '../../components/auth/protected-route';
import { Card } from '../../components/ui/card';
import { StatusBadge } from '../../components/ui/status-badge';
import { useAuth } from '../../providers/auth-provider';

function DashboardFoundation() {
  const { user } = useAuth();
  return (
    <main className="page-container py-12">
      <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-leaf">Protected route verified</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-[-0.04em]">Welcome, {user?.name}</h1>
          <p className="mt-2 text-ink/60">Step 11 will render the full {user?.role.toLowerCase()} dashboard here.</p>
        </div>
        <StatusBadge status={user?.role ?? 'AUTHENTICATED'} />
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {['Role-aware navigation', 'API-backed product data', 'Action-specific feedback'].map((title) => (
          <Card key={title} className="shadow-none">
            <h2 className="text-lg font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">Foundation ready; product interactions are intentionally reserved for the next feature branch.</p>
          </Card>
        ))}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return <ProtectedRoute><DashboardFoundation /></ProtectedRoute>;
}
