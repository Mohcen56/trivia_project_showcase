import { requireAuth } from '@/lib/auth';
import CategoryCreator from './CategoryCreator';

export default async function CreateCategoryPage() {
  await requireAuth();
  
  return <CategoryCreator />;
}