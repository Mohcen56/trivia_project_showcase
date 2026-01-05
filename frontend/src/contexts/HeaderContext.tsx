"use client";

import { createContext, useContext } from "react";

interface HeaderContextType {
  title: string;
  backHref: string;
  setHeader: (data: { title: string; backHref: string }) => void;
}

export const HeaderContext = createContext<HeaderContextType>({
  title: "",
  backHref: "/",
  setHeader: () => {},
});

export function useHeader() {
  return useContext(HeaderContext);
}
