import { handleErrorWithSentry, replayIntegration } from "@sentry/sveltekit";
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
  dsn: 'https://1ae869ed00684c3b8e64b279b2de5a97@o4508370903957504.ingest.us.sentry.io/4508388916985856',

  tracesSampleRate: 0.1,

  // This sets the sample rate to be 1%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.01,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // If you don't want to use Session Replay, just remove the line below:
  integrations: [replayIntegration()],
});

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry(({ error, event }) => {
  const errorMessage = (error as any)?.message || "";
  
  // Detect dynamic import chunk failures (usually caused by a new build deployment removing old hashes)
  if (
    errorMessage.includes("Failed to fetch dynamically imported module") ||
    errorMessage.includes("Failed to fetch")
  ) {
    const lastReload = sessionStorage.getItem("last_chunk_reload");
    const now = Date.now();
    
    // Throttled reload (at most once every 15s) to avoid infinite loops if network is actually offline
    if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
      sessionStorage.setItem("last_chunk_reload", now.toString());
      console.warn("Dynamic import failed (possibly due to deployment asset mismatch). Reloading page to fetch latest code...");
      window.location.reload();
    }
  }
});
