// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://89229643a00c5b6cdcc074d947b8517d@o4510369262534656.ingest.de.sentry.io/4510369269547088",

  // Only enable in production
  enabled: process.env.NODE_ENV === "production",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  
  // Enable logs to be sent to Sentry
  enableLogs: false,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: false, // Changed to false for privacy

  // Use default integrations but filter out auto-instrumentation we don't need
  integrations: (defaults) => {
    // Remove Prisma integration if it exists (we don't use Prisma in frontend)
    return defaults.filter((integration) => integration.name !== 'Prisma');
  },

  // Filter out noise
  ignoreErrors: [
    // Browser extensions
    "Non-Error promise rejection captured",
    "ResizeObserver loop limit exceeded",
    // Network errors
    "NetworkError",
    "Failed to fetch",
  ],

  beforeSend(event) {
    // Don't send errors in development
    if (process.env.NODE_ENV !== "production") {
      return null;
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;