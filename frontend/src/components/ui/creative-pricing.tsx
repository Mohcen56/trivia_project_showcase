import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/utils";
import Link from "next/link";

interface PricingTier {
    name: string;
    icon: React.ReactNode;
    price: number;
    originalPrice?: number;
    description: string;
    features: string[];
    popular?: boolean;
    color: string;
    href?: string;
}

function CreativePricing({
   
    title = "",
    description = "",
    tiers,
    onSelectTier,
    isProcessing = false,
}: {
    
    title?: string;
    description?: string;
    tiers: PricingTier[];
    onSelectTier?: (tier: PricingTier) => void;
    isProcessing?: boolean;
}) {
    return (
        <div className="w-full max-w-7xl mx-auto px-4">
            <div className="text-center space-y-3 mb-16 ">
               
                <div className="relative">
                    <h2 className="text-3xl md:text-5xl font-bold font-handwritten text-zinc-900 dark:text-white -mt-5 ">
                        {title}
                        <div className="absolute -right-12 top-0 text-amber-500 rotate-12">
                            ✨
                        </div>
                        <div className="absolute -left-8 -top-1 text-blue-500 -rotate-12">
                            ⭐️
                        </div>
                    </h2>
                    <div
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-44 h-3 bg-blue-500/20 
                        rounded-full blur-sm"
                    />
                </div>
                <p className="font-handwritten text-lg text-zinc-600 dark:text-zinc-400 ">
                    {description}
                </p>
            </div>

            <div className={cn(
                "grid gap-20 justify-center",
                tiers.length === 2 
                    ? "grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto" 
                    : "grid-cols-1 md:grid-cols-3"
            )}>
                {tiers.map((tier, index) => (
                    <div
                        key={tier.name}
                        className={cn(
                            "relative group",
                            "transition-all duration-300",
                            tiers.length === 2 ? (
                                index === 0 ? "md:rotate-[-2deg]" : "md:rotate-[2deg]"
                            ) : (
                                index === 0 ? "rotate-[-1deg]" :
                                index === 1 ? "rotate-[1deg]" : "rotate-[-2deg]"
                            )
                        )}
                    >
                        <div
                            className={cn(
                                "absolute inset-0 bg-white dark:bg-zinc-900",
                                "border-2 border-zinc-900 dark:border-white",
                                "rounded-lg shadow-[4px_4px_0px_0px] shadow-zinc-900 dark:shadow-white",
                                "transition-all duration-300",
                                "group-hover:shadow-[8px_8px_0px_0px]",
                                "group-hover:translate-x-[-4px]",
                                "group-hover:translate-y-[-4px]"
                            )}
                        />

                        <div className="relative p-6 flex flex-col min-h-[500px]">
                            {tier.originalPrice && tier.popular && (
                                <div className="absolute -top-2 -right-2 flex flex-col gap-1">
                                    <div className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-bold rotate-[8deg] border-2 border-zinc-900 shadow-md">
                                        {Math.round(((tier.originalPrice - tier.price) / tier.originalPrice) * 100)}% OFF
                                    </div>
                                    <div className="bg-amber-400 text-zinc-900 font-handwritten px-2 py-1 rounded-full rotate-[-6deg] text-xs border-2 border-zinc-900 shadow-md whitespace-nowrap">
                                        Limited Time!
                                    </div>
                                </div>
                            )}

                            <div className=" flex mb-6">
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-full ",
                                        "flex items-center justify-center",
                                        "border-2 border-zinc-900 dark:border-white",
                                        `text-${tier.color}-500`
                                    )}
                                >
                                    {tier.icon}
                                </div>
                                <h3 className="font-handwritten text-2xl text-zinc-900 px-2 dark:text-white">
                                    {tier.name}
                                </h3>
                                </div>
                                

                            {/* Price */}
                            <div className="font-handwritten mb-2">
                                {tier.originalPrice ? (
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="flex items-baseline">
                                             <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                                                ${tier.price}
                                            </span>
                                           
                                           
                                        </div>
                                        <div className="flex items-baseline">
                                            <span className="text-2xl font-bold text-zinc-400 dark:text-zinc-600 line-through">
                                                ${tier.originalPrice}
                                            </span>
                                            
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-bold text-zinc-900 dark:text-white">
                                            ${tier.price}
                                        </span>
                                    </div>
                                )}
                                {tier.price > 0 && (
                                    <div className="mt-2 inline-flex items-center gap-2">
                                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                            One-time payment
                                        </span>
                                        <span className="bg-gradient-to-r from-amber-400 to-yellow-400 text-zinc-900 px-2 py-0.5 rounded text-xs font-bold border border-zinc-900">
                                            ✨ LIFETIME
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="mb-4">
                                <p className="font-handwritten text-zinc-600 dark:text-zinc-400">
                                    {tier.description}
                                </p>
                            </div>
                            <div className="space-y-3 mb-auto">
                                {tier.features.map((feature) => (
                                    <div
                                        key={feature}
                                        className="flex items-center gap-3"
                                    >
                                        <div
                                            className="w-5 h-5 rounded-full border-2 border-zinc-900 
                                            dark:border-white flex items-center justify-center"
                                        >
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="font-handwritten text-lg text-zinc-900 dark:text-white">
                                            {feature}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8">
                                                        {tier.href && !onSelectTier ? (
                                                            <Button
                                                                asChild
                                                                className={cn(
                                                                    "w-full h-12 font-handwritten text-lg relative",
                                                                    "border-2 border-zinc-900 dark:border-white",
                                                                    "transition-all duration-300",
                                                                    "shadow-[4px_4px_0px_0px] shadow-zinc-900 dark:shadow-white",
                                                                    "hover:shadow-[6px_6px_0px_0px]",
                                                                    "hover:translate-x-[-2px] hover:translate-y-[-2px]",
                                                                    tier.popular
                                                                        ? [
                                                                                "bg-amber-400 text-zinc-900",
                                                                                "hover:bg-amber-300",
                                                                                "active:bg-amber-400",
                                                                                "dark:hover:bg-amber-300",
                                                                                "dark:active:bg-amber-400",
                                                                            ]
                                                                        : [
                                                                                "bg-zinc-50 dark:bg-zinc-800",
                                                                                "text-zinc-900 dark:text-white",
                                                                                "hover:bg-white dark:hover:bg-zinc-700",
                                                                                "active:bg-zinc-50 dark:active:bg-zinc-800",
                                                                            ]
                                                                )}
                                                            >
                                                                <Link href={tier.href}>Get Started</Link>
                                                            </Button>
                                                        ) : (
                                                            <Button
                                onClick={() => onSelectTier?.(tier)}
                                disabled={isProcessing}
                                className={cn(
                                    "w-full h-12 font-handwritten text-lg relative",
                                    "border-2 border-zinc-900 dark:border-white",
                                    "transition-all duration-300",
                                    "shadow-[4px_4px_0px_0px] shadow-zinc-900 dark:shadow-white",
                                    "hover:shadow-[6px_6px_0px_0px]",
                                    "hover:translate-x-[-2px] hover:translate-y-[-2px]",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    tier.popular
                                        ? [
                                              "bg-amber-400 text-zinc-900",
                                              "hover:bg-amber-300",
                                              "active:bg-amber-400",
                                              "dark:hover:bg-amber-300",
                                              "dark:active:bg-amber-400",
                                          ]
                                        : [
                                              "bg-zinc-50 dark:bg-zinc-800",
                                              "text-zinc-900 dark:text-white",
                                              "hover:bg-white dark:hover:bg-zinc-700",
                                              "active:bg-zinc-50 dark:active:bg-zinc-800",
                                          ]
                                )}
                            >
                                {isProcessing ? "Processing..." : "Get Started"}
                                                            </Button>
                                                        )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="absolute -z-10 inset-0 overflow-hidden">
                <div className="absolute top-40 left-20 text-4xl rotate-12">
                    ✎
                </div>
                <div className="absolute bottom-40 right-20 text-4xl -rotate-12">
                    ✏️
                </div>
            </div>
        </div>
    );
}


export { CreativePricing }
export type { PricingTier }