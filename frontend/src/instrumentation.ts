import * as Sentry from '@sentry/nextjs';

// Next.js will call register() in the appropriate runtime (server/edge)
// Move Sentry.init here (instead of sentry.server.config.ts / sentry.edge.config.ts)
export async function register() {
  // Prefer env var; fallback to the current hardcoded DSN
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || 'https://89229643a00c5b6cdcc074d947b8517d@o4510369262534656.ingest.de.sentry.io/4510369269547088';

  // Avoid double-initialization if register() runs more than once
  // @sentry/nextjs guards repeated init internally, but we can still be cautious
  // Initialize Sentry
  Sentry.init({
    dsn,
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 1,
    enableLogs: false,
    sendDefaultPii: false,
    integrations: (defaults) => defaults.filter((i) => i.name !== 'Prisma'),
    beforeSend(event) {
      if (process.env.NODE_ENV !== 'production') {
        return null;
      }
      return event;
    },
  });
}
