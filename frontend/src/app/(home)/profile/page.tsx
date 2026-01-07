import { requireAuth } from '@/lib/auth';
import ProfileClient from "./Client";

export default async function ProfilePage() {
  // Server-side auth check - redirects to login if not authenticated
  const { user } = await requireAuth();
  
  return <ProfileClient initialUser={user} />;
}
