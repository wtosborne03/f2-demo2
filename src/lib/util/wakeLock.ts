/**
 * Screen Wake Lock Manager for CouchCup Mobile Controller.
 * Keeps the device display on during active game sessions, preventing
 * phone screens from auto-locking and dropping WebSockets.
 * Automatically handles page visibility changes (reacquires lock when returning to tab).
 */

let wakeLockSentinel: WakeLockSentinel | null = null;
let isLockRequested = false;
let isListeningVisibility = false;

async function acquireLock(): Promise<void> {
  if (typeof navigator === "undefined" || !("wakeLock" in navigator)) {
    return;
  }

  // Already holding an active lock
  if (wakeLockSentinel && !wakeLockSentinel.released) {
    return;
  }

  try {
    wakeLockSentinel = await navigator.wakeLock.request("screen");
    wakeLockSentinel.addEventListener("release", () => {
      // Sentinel released (e.g. by system when app went background)
      wakeLockSentinel = null;
    });
    console.log("[WakeLock] Screen wake lock acquired successfully.");
  } catch (err: any) {
    // Some browsers reject if battery saver is active or document is not visible
    console.warn("[WakeLock] Failed to acquire screen wake lock:", err?.message || err);
    wakeLockSentinel = null;
  }
}

async function handleVisibilityChange(): Promise<void> {
  if (isLockRequested && document.visibilityState === "visible") {
    await acquireLock();
  }
}

export async function requestScreenWakeLock(): Promise<void> {
  isLockRequested = true;

  if (typeof document !== "undefined" && !isListeningVisibility) {
    document.addEventListener("visibilitychange", handleVisibilityChange);
    isListeningVisibility = true;
  }

  await acquireLock();
}

export async function releaseScreenWakeLock(): Promise<void> {
  isLockRequested = false;

  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch (e) {
      // Ignore
    }
    wakeLockSentinel = null;
  }

  if (typeof document !== "undefined" && isListeningVisibility) {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    isListeningVisibility = false;
  }

  console.log("[WakeLock] Screen wake lock released.");
}
