import * as Sentry from "@sentry/nextjs";

export const trackError = (error: unknown, context?: Record<string, unknown>) => {
  if (process.env.NODE_ENV === "production") {
    const err = error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } else {
    console.error("Error:", error, context);
  }
};

export default trackError;
