/**
 * Server-side error monitoring (Sentry) — inert until SENTRY_DSN is set,
 * so the free-forever guarantee holds by default.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }
}

export async function onRequestError(...args: unknown[]) {
  if (process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    // @ts-expect-error — passthrough to Sentry's request error hook
    return Sentry.captureRequestError(...args);
  }
}
