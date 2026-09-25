import Link from 'next/link';
import { EmptyState } from '../components/ui/page-state';

export default function NotFound() {
  return (
    <main className="page-container py-12">
      <EmptyState title="This route missed its turn" description="The page does not exist or has moved to another Dhaka zone." />
      <Link className="mx-auto mt-6 block w-fit text-sm font-bold text-leaf hover:text-ink" href="/">Return home</Link>
    </main>
  );
}
