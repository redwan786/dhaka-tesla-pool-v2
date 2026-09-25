'use client';

import { ErrorState } from '../components/ui/page-state';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-container py-12">
      <ErrorState message="The page could not be loaded. Your data has not been changed." onRetry={reset} />
    </main>
  );
}
