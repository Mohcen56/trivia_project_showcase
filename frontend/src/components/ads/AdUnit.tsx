"use client";

import { useEffect } from "react";

type AdUnitProps = {
  slot: string | number;
  className?: string;
};

type AdsbygoogleObject = Record<string, unknown>;
interface AdsByGoogleWindow extends Window {
  adsbygoogle: AdsbygoogleObject[];
}

export default function AdUnit({ slot, className = "" }: AdUnitProps) {
  useEffect(() => {
    try {
      // load ad
      const w = window as unknown as AdsByGoogleWindow;
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {}
  }, []);

  return (
    <ins
      className={`adsbygoogle block ${className}`}
      data-ad-client="ca-pub-6921186401785443"
      data-ad-slot={String(slot)}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
