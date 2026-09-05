import { writable } from "svelte/store";
import { browser } from "$app/environment";

export const isKeyboardVisible = writable(false);

if (browser) {
  // Detect if the device/browser environment uses an on-screen virtual keyboard
  const isVirtualKeyboardDevice = (): boolean => {
    // Check for native Capacitor mobile platform (iOS/Android)
    const isCapacitor = !!(
      window as unknown as {
        Capacitor?: { isNativePlatform?: () => boolean };
      }
    ).Capacitor?.isNativePlatform?.();
    if (isCapacitor) return true;

    const ua = navigator.userAgent || "";
    const isMobileUA =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);

    const hasTouch =
      "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
    const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    const isFinePointer = window.matchMedia?.(
      "(hover: hover) and (pointer: fine)"
    )?.matches;

    // Standard desktop: no touch or fine pointer without mobile UA
    if (!hasTouch && !isCoarse) return false;
    if (isFinePointer && !isMobileUA) return false;

    return true;
  };

  // Track recent touch interaction to differentiate touch taps from mouse clicks
  let hasRecentTouch = false;
  let touchTimer: ReturnType<typeof setTimeout> | null = null;

  const recordTouch = () => {
    hasRecentTouch = true;
    if (touchTimer) clearTimeout(touchTimer);
    touchTimer = setTimeout(() => {
      hasRecentTouch = false;
    }, 1200);
  };

  window.addEventListener("touchstart", recordTouch, { passive: true });
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "touch") {
        recordTouch();
      }
    },
    { passive: true }
  );

  let maxUnfocusedHeight = window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight;

  let isPendingFocusCheck = false;
  let focusCheckTimeout: ReturnType<typeof setTimeout> | null = null;

  const isTextInput = (el: Element | null): boolean => {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    if (tag === "TEXTAREA") return true;
    if (tag === "INPUT") {
      const type = (el as HTMLInputElement).type?.toLowerCase() || "text";
      return [
        "text",
        "search",
        "url",
        "tel",
        "email",
        "password",
        "number",
      ].includes(type);
    }
    return el.getAttribute("contenteditable") === "true";
  };

  const evaluateKeyboardState = () => {
    // If not a virtual keyboard device, virtual keyboard is never visible
    if (!isVirtualKeyboardDevice()) {
      isKeyboardVisible.set(false);
      return;
    }

    const activeEl = document.activeElement;
    const activeIsText = isTextInput(activeEl);

    const currentHeight = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;

    if (!activeIsText) {
      isPendingFocusCheck = false;
      if (focusCheckTimeout) {
        clearTimeout(focusCheckTimeout);
        focusCheckTimeout = null;
      }
      maxUnfocusedHeight = currentHeight;
      isKeyboardVisible.set(false);
      return;
    }

    if (currentHeight > maxUnfocusedHeight) {
      maxUnfocusedHeight = currentHeight;
    }

    // Check if VirtualKeyboard API is supported and active
    const vk = (
      navigator as unknown as {
        virtualKeyboard?: { boundingRect?: DOMRect };
      }
    ).virtualKeyboard;
    const vkHeight = vk?.boundingRect?.height || 0;

    // A text input is focused: check if screen is compressed by virtual keyboard
    const heightDifference = maxUnfocusedHeight - currentHeight;

    if (heightDifference > 80 || vkHeight > 80) {
      isKeyboardVisible.set(true);
    } else if (isPendingFocusCheck) {
      // In the middle of opening animation on a mobile touch tap
      isKeyboardVisible.set(true);
    } else {
      isKeyboardVisible.set(false);
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      const currentHeight = window.visualViewport!.height;
      if (maxUnfocusedHeight - currentHeight < 50) {
        isPendingFocusCheck = false;
      }
      evaluateKeyboardState();
    });
    window.visualViewport.addEventListener("scroll", evaluateKeyboardState);
  }

  if ("virtualKeyboard" in navigator) {
    const vk = (
      navigator as unknown as { virtualKeyboard?: EventTarget }
    ).virtualKeyboard;
    vk?.addEventListener?.("geometrychange", evaluateKeyboardState);
  }

  window.addEventListener("resize", () => {
    if (!isTextInput(document.activeElement)) {
      maxUnfocusedHeight = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
    }
    evaluateKeyboardState();
  });

  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      maxUnfocusedHeight = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      evaluateKeyboardState();
    }, 200);
  });

  window.addEventListener("focusin", (e) => {
    if (isTextInput(e.target as Element)) {
      // On desktop, do NOT anticipate or trigger keyboard animation
      if (!isVirtualKeyboardDevice()) {
        isKeyboardVisible.set(false);
        return;
      }

      // On mobile / touch device with a recent touch interaction, anticipate keyboard opening
      if (hasRecentTouch) {
        isPendingFocusCheck = true;
        isKeyboardVisible.set(true);

        if (focusCheckTimeout) clearTimeout(focusCheckTimeout);
        focusCheckTimeout = setTimeout(() => {
          isPendingFocusCheck = false;
          evaluateKeyboardState();
        }, 450);
      } else {
        evaluateKeyboardState();
      }
    }
  });

  window.addEventListener("focusout", () => {
    setTimeout(() => {
      evaluateKeyboardState();
    }, 60);
  });
}

