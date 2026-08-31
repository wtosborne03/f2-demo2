import { writable } from "svelte/store";
import { browser } from "$app/environment";

export const isKeyboardVisible = writable(false);

if (browser) {
  let initialHeight = window.innerHeight;

  const checkKeyboard = () => {
    const activeEl = document.activeElement;
    const isInputActive =
      activeEl instanceof HTMLElement &&
      (activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA" ||
        activeEl.getAttribute("contenteditable") === "true");

    let keyboardOpen = false;

    if (window.visualViewport) {
      const heightDiff = window.innerHeight - window.visualViewport.height;
      const heightRatio = window.visualViewport.height / window.innerHeight;
      if (heightDiff > 140 || (isInputActive && heightRatio < 0.85)) {
        keyboardOpen = true;
      }
    } else if (isInputActive) {
      const heightDiff = initialHeight - window.innerHeight;
      if (heightDiff > 140) {
        keyboardOpen = true;
      }
    }

    isKeyboardVisible.set(Boolean(keyboardOpen));
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", checkKeyboard);
    window.visualViewport.addEventListener("scroll", checkKeyboard);
  }

  window.addEventListener("resize", () => {
    initialHeight = Math.max(initialHeight, window.innerHeight);
    checkKeyboard();
  });

  window.addEventListener("focusin", checkKeyboard);
  window.addEventListener("focusout", () => {
    setTimeout(checkKeyboard, 100);
  });
}
