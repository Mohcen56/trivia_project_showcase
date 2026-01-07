"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { HeaderContext } from "@/contexts/HeaderContext";

interface HomeLayoutContentProps {
  children: React.ReactNode;
}

/**
 * Client-side layout content for the home section.
 * Header uses SessionProvider internally for user data.
 */
export default function HomeLayoutContent({ children }: HomeLayoutContentProps) {
  const [headerData, setHeaderData] = useState({ title: "", backHref: "/" });

  return (
    <HeaderContext.Provider value={{ ...headerData, setHeader: setHeaderData }}>
      <Header title={headerData.title} backHref={headerData.backHref} />
      <main>{children}</main>
    </HeaderContext.Provider>
  );
}
