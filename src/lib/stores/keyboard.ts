import { writable } from "svelte/store";
import { browser } from "$app/environment";

export const isKeyboardVisible = writable(false);

if (browser) {
  let maxUnfocusedHeight = Math.max(
    window.innerHeight,
    window.visualViewport?.height || 0
  );
  let isFocused = false;

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
    const activeEl = document.activeElement;
    const activeIsText = isTextInput(activeEl);

    const currentHeight = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;

    if (!activeIsText) {
      isFocused = false;
      maxUnfocusedHeight = Math.max(maxUnfocusedHeight, window.innerHeight, currentHeight);
      isKeyboardVisible.set(false);
      return;
    }

    // A text input is currently focused
    const heightDifference = maxUnfocusedHeight - currentHeight;

    if (heightDifference > 120) {
      // Screen is compressed by virtual keyboard
      isKeyboardVisible.set(true);
    } else {
      // If height returned to normal full-screen height (diff < 50px) and it's not the initial focus
      if (heightDifference < 50 && maxUnfocusedHeight > 400 && !isFocused) {
        isKeyboardVisible.set(false);
      } else {
        // Just focused or still within opening threshold
        isKeyboardVisible.set(true);
      }
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      // When viewport resizes, check if it expanded back to full size
      const currentHeight = window.visualViewport!.height;
      if (maxUnfocusedHeight - currentHeight < 60 && maxUnfocusedHeight > 400) {
        isFocused = false;
      }
      evaluateKeyboardState();
    });
    window.visualViewport.addEventListener("scroll", evaluateKeyboardState);
  }

  window.addEventListener("resize", () => {
    if (!isTextInput(document.activeElement)) {
      maxUnfocusedHeight = Math.max(window.innerHeight, window.visualViewport?.height || 0);
    }
    evaluateKeyboardState();
  });

  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      maxUnfocusedHeight = Math.max(window.innerHeight, window.visualViewport?.height || 0);
      evaluateKeyboardState();
    }, 200);
  });

  window.addEventListener("focusin", (e) => {
    if (isTextInput(e.target as Element)) {
      isFocused = true;
      isKeyboardVisible.set(true);
      setTimeout(() => {
        isFocused = false;
        evaluateKeyboardState();
      }, 400);
    }
  });

  window.addEventListener("focusout", () => {
    setTimeout(() => {
      evaluateKeyboardState();
    }, 60);
  });
}
