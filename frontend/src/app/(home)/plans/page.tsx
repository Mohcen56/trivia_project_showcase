import { requireAuth } from "@/lib/auth";
import PricingPlans from "./PricingPlans";

export default async function PricingPage() {
  await requireAuth();
  
  return <PricingPlans />;
}


