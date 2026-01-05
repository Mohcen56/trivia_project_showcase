import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
 

  images: {
    unoptimized: true,
    remotePatterns: [
      // Cloudflare R2 Storage (production)
      {
        protocol: 'https',
        hostname: 'f7ac1437b17c329ca5dcbd482f634410.r2.cloudflarestorage.com',
        pathname: '/**',
      },
      {
      protocol: "https",
      hostname: "cdn.triviaspirit.com",
    },
      // Local Django backend (development only)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
    ],
  },

  // Webpack config to exclude Prisma and other Node.js modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Prisma and OpenTelemetry (not needed in frontend)
      config.resolve.alias = {
        ...config.resolve.alias,
        '@prisma/instrumentation': false,
        '@opentelemetry/instrumentation': false,
      };

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
      };
    }

    // Ignore Prisma warnings
    config.ignoreWarnings = [
      { module: /@prisma\/instrumentation/ },
      { module: /@opentelemetry\/instrumentation/ },
    ];

    return config;
  },
};

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
  {
    org: "mohcen",
    project: "javascript-nextjs",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
    disableLogger: true,
    automaticVercelMonitors: true,
  }
);
