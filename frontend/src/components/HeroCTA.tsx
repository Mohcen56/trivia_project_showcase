"use client";

import { useRouter } from "next/navigation";
import { useAuthGate } from "@/hooks/useAuthGate";

export default function HeroCTA() {
  const { user } = useAuthGate();
  const router = useRouter();

  const handleClick = () => {
    if (user) return router.push("/dashboard");
    router.push("/login");
  };

  return (
    <button
      onClick={handleClick}
      className="group/button relative inline-flex items-center justify-center gap-3 
                 overflow-hidden rounded-md bg-indianred px-15 py-3 md:px-30 md:py-5 
                 text-xs font-normal text-white transition-all duration-300 ease-in-out 
                 hover:scale-105 hover:shadow-lg hover:shadow-red-500/30"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded text-white">
        <svg aria-hidden="true" className="h-8 w-8" viewBox="0 0 12 12" fill="currentColor">
          <path d="M4 3.065v5.87a.4.4 0 0 0 .623.331l4.268-2.935a.4.4 0 0 0 0-.662L4.623 2.064A.4.4 0 0 0 4 2.395Z" />
        </svg>
      </span>
      <span className=" text-lg md:text-xl font-bold">Start playing</span>
      <div className="absolute inset-0 flex h-full  w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
        <div className="relative h-full w-8 bg-white/20" />
      </div>
    </button>
  );
}
