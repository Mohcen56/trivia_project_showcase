import { requireAuth } from '@/lib/auth';
import CategoriesList from './CategoriesList';

export default async function CategoriesPage() {
  // Auth check - redirects to login if not authenticated
  await requireAuth();
  
  return <CategoriesList initialData={null} />;
}