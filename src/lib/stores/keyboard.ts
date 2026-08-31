import { writable } from "svelte/store";
import { browser } from "$app/environment";

export const isKeyboardVisible = writable(false);

if (browser) {
  let initialHeight = window.innerHeight;
  let focusTimestamp = 0;

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

  const updateState = (forcedState?: boolean) => {
    if (forcedState !== undefined) {
      isKeyboardVisible.set(forcedState);
      return;
    }

    const activeEl = document.activeElement;
    const activeIsText = isTextInput(activeEl);

    let keyboardOpen = false;

    if (window.visualViewport) {
      const vvHeight = window.visualViewport.height;
      const winHeight = window.innerHeight;
      const heightDiff = winHeight - vvHeight;
      const heightRatio = vvHeight / winHeight;

      if (heightDiff > 80 || heightRatio < 0.88) {
        // Viewport is visibly contracted by virtual keyboard
        keyboardOpen = true;
      } else if (activeIsText && Date.now() - focusTimestamp < 450) {
        // Just focused within 450ms, waiting for keyboard animation to compress viewport
        keyboardOpen = true;
      } else {
        // Viewport has expanded back to full size -> Keyboard is physically closed!
        keyboardOpen = false;
      }
    } else {
      const heightDiff = initialHeight - window.innerHeight;
      if (heightDiff > 100) {
        keyboardOpen = true;
      } else if (activeIsText && Date.now() - focusTimestamp < 450) {
        keyboardOpen = true;
      } else {
        keyboardOpen = false;
      }
    }

    isKeyboardVisible.set(keyboardOpen);
  };

  const scheduleChecks = () => {
    updateState();
    setTimeout(updateState, 50);
    setTimeout(updateState, 150);
    setTimeout(updateState, 350);
    setTimeout(updateState, 500);
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => updateState());
    window.visualViewport.addEventListener("scroll", () => updateState());
  }

  window.addEventListener("resize", () => {
    if (!isTextInput(document.activeElement)) {
      initialHeight = Math.max(initialHeight, window.innerHeight);
    }
    updateState();
  });

  window.addEventListener("focusin", (e) => {
    if (isTextInput(e.target as Element)) {
      focusTimestamp = Date.now();
      updateState(true);
      scheduleChecks();
    }
  });

  window.addEventListener("focusout", () => {
    setTimeout(() => {
      const activeEl = document.activeElement;
      if (!isTextInput(activeEl)) {
        updateState(false);
      } else {
        updateState();
      }
    }, 50);
  });
}
