import { writable } from "svelte/store";
import { browser } from "$app/environment";

function checkInitialCasting(): boolean {
  if (!browser) return false;
  try {
    const sp = new URLSearchParams(window.location.search);
    if (sp.has("isCasting") || sp.has("cast")) {
      return true;
    }
    if (typeof window !== "undefined" && (window as any).CouchCupAndroid?.isCasting?.()) {
      return true;
    }
  } catch (e) {
    console.warn("Error checking casting state", e);
  }
  return false;
}

export const isCasting = writable<boolean>(checkInitialCasting());

if (browser) {
  window.addEventListener("nativeRoomCode", (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.isCasting !== undefined) {
      isCasting.set(!!detail.isCasting);
    }
  });

  window.addEventListener("nativeCastingState", (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.isCasting !== undefined) {
      isCasting.set(!!detail.isCasting);
    }
  });
}
