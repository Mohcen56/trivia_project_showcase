import { getSession } from '@/lib/auth';
import Client from './Client';

export default async function CreateCategoryPage() {
  const session = await getSession();
  
  return <Client userIsPremium={session.isPremium} />;
}