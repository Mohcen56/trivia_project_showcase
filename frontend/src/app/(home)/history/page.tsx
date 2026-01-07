import { requireAuth } from '@/lib/auth';
import HistoryClient from './HistoryClient';

// Server-side auth check - redirects to login if not authenticated
export default async function HistoryPage() {
  await requireAuth();
  
  return <HistoryClient />;
}