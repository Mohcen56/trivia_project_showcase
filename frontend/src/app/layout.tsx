import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next"
import ReduxProvider from "@/components/utils/ReduxProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import ErrorBoundary from "@/components/utils/ErrorBoundary";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { Analytics } from '@vercel/analytics/next';
import { GoogleOAuthProvider } from '@react-oauth/google';

import Script from "next/script";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Add font-display: swap for better performance
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Add font-display: swap for better performance
  preload: true,
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.triviaspirit.com"),

  title: {
    default: "Trivia Spirit – The Ultimate Trivia Game for Family & Friends",
    template: "%s | Trivia Spirit"
  },
  description:
    "Play Trivia Spirit — the ultimate trivia game for families and friends. Enjoy thousands of curated questions across history, tech, movies, geography, anime, science, sports, and more. Play instantly online!",

  keywords: [
    "trivia game",
    "quiz game",
    "family trivia game",
    "trivia for friends",
    "brain quiz",
    "knowledge game",
    "online trivia",
    "fun trivia",
    "quiz categories",
    "trivia spirit",
    "play trivia online",
    "fast trivia game",
    "multiplayer trivia",
    "team trivia game",
    "trivia challenges",
    "educational trivia",
    "history trivia",
    "science trivia",
    "movie trivia",
    "sports trivia",
  ],

  authors: [{ name: "Trivia Spirit Team" }],
  creator: "Trivia Spirit",
  publisher: "Trivia Spirit",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "https://www.triviaspirit.com",
  },

  openGraph: {
    title: "Trivia Spirit – The Ultimate Trivia Game for Family & Friends",
    description:
      "Challenge your mind with thousands of curated trivia questions across dozens of categories. Perfect for families and friends. Play instantly — no downloads needed!",
    url: "https://www.triviaspirit.com",
    siteName: "Trivia Spirit",
    images: [
      {
        url: "https://www.triviaspirit.com/og-image.png", // Full URL required for social media
        width: 1200,
        height: 630,
        alt: "Trivia Spirit - The Ultimate Trivia Game",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    site: "@triviaspirit",
    creator: "@triviaspirit",
    title: "Trivia Spirit – The Ultimate Trivia Game",
    description:
      "Play Trivia Spirit — the ultimate trivia game for families and friends with thousands of questions!",
    images: ["https://www.triviaspirit.com/og-image.png"], // Full URL required
  },

  verification: {
    google: "your-google-verification-code-here",
  },

  category: "games",

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Google AdSense Verification */}
        <meta name="google-adsense-account" content="ca-pub-6921186401785443" />
        
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Structured Data for Google */}
        {/* Organization Schema for Logo Display */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Trivia Spirit",
              "url": "https://www.triviaspirit.com",
              "logo": "https://www.triviaspirit.com/logo/mylogo.webp",
              "sameAs": [
                "https://www.instagram.com/triviaspirit",
                "https://twitter.com/triviaspirit"
              ]
            })
          }}
        />
        {/* WebApplication Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Trivia Spirit",
              "description": "The ultimate trivia game for families and friends with thousands of curated questions",
              "url": "https://www.triviaspirit.com",
              "applicationCategory": "GameApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "1250"
              }
            })
          }}
        />
        <Script
          id="adsbygoogle-init"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6921186401785443"
          strategy="lazyOnload"
          crossOrigin="anonymous"
          async
        />
      </head>
      
      {/* Google Analytics - Must be outside <head> in Next.js */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `,
            }}
          />
        </>
      )}
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID || ""}>
          <QueryProvider>
            <ReduxProvider>
              <ErrorBoundary>
                <NotificationProvider>
                  {children}<SpeedInsights />
                   <Analytics />
                </NotificationProvider>
              </ErrorBoundary>
            </ReduxProvider>
          </QueryProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
