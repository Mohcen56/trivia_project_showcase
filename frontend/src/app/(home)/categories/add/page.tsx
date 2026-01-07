import { requireAuth } from '@/lib/auth';
import AddedCategoriesBrowser from './AddedCategoriesBrowser';

export default async function AddCategoriesPage() {
  await requireAuth();
  
  return <AddedCategoriesBrowser />;
}