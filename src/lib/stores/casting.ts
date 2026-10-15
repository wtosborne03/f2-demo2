import { writable } from "svelte/store";
import { browser } from "$app/environment";

export function getNativeCastingBridge() {
  if (!browser) return null;
  return (
    (window as any).CouchCupAndroid ||
    (window as any).CouchCupIOS ||
    (window as any).CouchCupNative ||
    null
  );
}

function checkInitialCasting(): boolean {
  if (!browser) return false;
  try {
    const sp = new URLSearchParams(window.location.search);
    if (sp.has("isCasting") || sp.has("cast")) {
      return true;
    }
    const bridge = getNativeCastingBridge();
    if (bridge?.isCasting?.()) {
      return true;
    }
  } catch (e) {
    console.warn("Error checking casting state", e);
  }
  return false;
}

export const isCasting = writable<boolean>(checkInitialCasting());

if (browser) {
  // Proactively purge any stale legacy localStorage casting keys
  if (!checkInitialCasting()) {
    try {
      localStorage.removeItem("is_casting");
    } catch {}
  }

  window.addEventListener("nativeRoomCode", (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.isCasting !== undefined) {
      const active = !!detail.isCasting;
      isCasting.set(active);
      if (!active) {
        try {
          localStorage.removeItem("is_casting");
        } catch {}
      }
    }
  });

  window.addEventListener("nativeCastingState", (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.isCasting !== undefined) {
      const active = !!detail.isCasting;
      isCasting.set(active);
      if (!active) {
        try {
          localStorage.removeItem("is_casting");
        } catch {}
      }
    }
  });
}
