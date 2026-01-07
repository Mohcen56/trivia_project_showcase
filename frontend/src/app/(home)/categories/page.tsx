import { requireAuth } from '@/lib/auth';
import CategoriesList from './CategoriesList';

// Server-side auth check - proxy will also redirect but this is a fallback
export default async function CategoriesPage() {
  const session = await requireAuth();
  
  return <CategoriesList initialData={null} userIsPremium={session.isPremium} userId={session.user.id} />;
}