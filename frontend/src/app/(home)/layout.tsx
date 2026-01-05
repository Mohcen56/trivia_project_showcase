"use client";
import { SpeedInsights } from "@vercel/speed-insights/next"
import { useState } from "react";
import Header from "@/components/Header";
import { HeaderContext } from "@/contexts/HeaderContext";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const [headerData, setHeaderData] = useState({ title: "", backHref: "/" });

  return (
    <HeaderContext.Provider value={{ ...headerData, setHeader: setHeaderData }}>
      <Header title={headerData.title} backHref={headerData.backHref} />
      <main>{children}<SpeedInsights /></main>
    </HeaderContext.Provider>
  );
}
