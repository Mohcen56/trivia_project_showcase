import { SpeedInsights } from "@vercel/speed-insights/next"
import HomeLayoutContent from "./HomeLayoutContent";

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <HomeLayoutContent>
      {children}
      <SpeedInsights />
    </HomeLayoutContent>
  );
}
