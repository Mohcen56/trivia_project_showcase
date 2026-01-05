import { trackError } from "./errorTracking";

export const logger = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always emit to console in all envs
    console.error(...args);
  },
  exception: (error: unknown, context?: Record<string, unknown>) => {
    // Forward to error tracker in production; console in dev handled by trackError
    trackError(error, context);
  },
};

export default logger;
