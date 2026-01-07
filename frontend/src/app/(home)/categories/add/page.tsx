import { requireAuth } from '@/lib/auth';
import Client from './Client';

export default async function addcategories() {
  const session = await requireAuth();
  
  return <Client userIsPremium={session.isPremium} userId={session.user.id} />;
}