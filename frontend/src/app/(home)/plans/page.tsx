import { getSession } from "@/lib/auth";
import Client from "./Client";

export default async function PricingPage() {
  const session = await getSession();
  
  // Pass premium status from server
  return <Client userIsPremium={session.isPremium} />;
}


