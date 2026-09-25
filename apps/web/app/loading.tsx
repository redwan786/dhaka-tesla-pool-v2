import { LoadingState } from '../components/ui/page-state';

export default function Loading() {
  return <main className="page-container py-12"><LoadingState message="Preparing your Tesla pool…" /></main>;
}
