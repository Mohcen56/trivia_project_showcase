import { requireAuth } from '@/lib/auth';
import ProfileEditor from "./ProfileEditor";

export default async function ProfilePage() {
  // Server-side auth check - redirects to login if not authenticated
  const { user } = await requireAuth();
  
  return <ProfileEditor initialUser={user} />;
}
