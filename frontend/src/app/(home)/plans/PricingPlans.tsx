"use client";

import React, { useEffect, useState } from "react";
import { CreativePricing } from "@/components/ui/creative-pricing";
import type { PricingTier } from "@/components/ui/creative-pricing";
import { Pencil, Star } from "lucide-react";
import { useHeader } from "@/contexts/HeaderContext";
import { createCheckout, redirectToCheckout } from "@/lib/utils/payments";
import { useRouter } from "next/navigation";
import { PremiumDashboard } from "@/components/Premium/PremiumDashboard";
import Link from "next/link";
import { logger } from "@/lib/utils/logger";
import { useSession } from "@/providers/SessionProvider";
 

const sampleTiers: PricingTier[] = [
  {
    name: "Free",
    icon: <Pencil className="w-6 h-6" />,
    price: 0,
    description: "Try 6 base categories — no cost ",
    color: "blue",
    href: "/dashboard",
    features: [
      "Access 6 base categories",
      "No repeated questions",
      "Create & play your own category",
      
      
    ],
  },
  {
    name: "Lifetime Premium",
    icon: <Star className="w-6 h-6" />,
    price: 39.99,
    originalPrice: 50,    
    description: "Unlock ALL content now and ALL future updates",
    color: "yellow",
   features: [
  "Unlimited access to all current trivia categories",
  "All future categories & game updates included forever",
  "Full access to community-created categories",
  "Early Supporter badge (profile & lobby)",
  "Free access to the upcoming Solo Game Mode",
],
    popular: true,
  },
  // {
  //   name: "Plus",
  //   icon: <Sparkles className="w-6 h-6" />,
  //   price: 15,
  //   description: "A step above Free, but With ads",
  //   color: "purple",
  //   features: [
  //     "Unlock 10+ categories",
  //     "Weekly new category drops",
  //     "Access all community categories",
  //   ],
  // },
];

export default function PricingPlans() {
    const { setHeader } = useHeader();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const { isPremium } = useSession();
    
     useEffect(() => {
    setHeader({ title: "Level Up Your Trivia Experience", backHref: "/dashboard" });
  }, [setHeader]);

  // Show Premium Dashboard if user is premium (checked on server)
  if (isPremium) {
    return <PremiumDashboard />;
  }

  const handlePurchase = async (tier: PricingTier) => {
    // Skip for free tier
    if (tier.price === 0) {
      router.push("/dashboard");
      return;
    }

    setIsProcessing(true);

    try {
      // Create checkout session (backend will use server-configured variant_id)
      const { checkout_url } = await createCheckout("premium");
      
      // Redirect to Lemon Squeezy checkout
      redirectToCheckout(checkout_url);
      
    } catch (error: unknown) {
      logger.exception(error, { where: "plans.checkout" });
      
      // Extract error message safely
      let errorMessage = "Failed to start checkout. Please try again or contact support.";
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string; error?: string } } };
        errorMessage = axiosError.response?.data?.detail 
          || axiosError.response?.data?.error 
          || errorMessage;
      }
      
      alert(`❌ Checkout Error\n\n${errorMessage}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <div className="flex-1 pt-15 ">
        <CreativePricing
          title="Level Up Your Trivia Experience"
          description="Enjoy premium perks with our Lifetime Premium plan."
          tiers={sampleTiers}
          onSelectTier={handlePurchase}
          isProcessing={isProcessing}
        />
        <p className="text-center text-sm text-gray-500 mt-15">
          Psst… sometimes we surprise our {" "} <a
      href="https://instagram.com/Trivia.Spirit"
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-500 underline"
    >
      Instagram
    </a>{" "} followers with secret discount codes 👀
        </p>
      </div>
      <footer className="mt-auto py-4 border-t border-gray-300">
        <p className="text-center text-xs text-gray-500  max-w-2xl mx-auto">
          By proceeding to purchase this plan, you accept our{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>,{" "}
          <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>, and{" "}
          <Link href="/refund" className="text-blue-600 hover:underline">Refund Policy</Link>.
        </p>
      </footer>
    </div>
    
  );
}
