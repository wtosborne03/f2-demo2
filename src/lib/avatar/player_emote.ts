import { gameClient } from "$lib/wsapi/gameClient";

/**
 * Trigger subtle haptic feedback using Web Vibration API if supported.
 */
export function triggerHapticFeedback(pattern: number | number[] = 15) {
  if (
    typeof navigator !== "undefined" &&
    "vibrate" in navigator &&
    typeof navigator.vibrate === "function"
  ) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration failures if unsupported or blocked by browser policy
    }
  }
}

/**
 * Send an emote to the host to animate the player's selfie avatar.
 * Triggers a brief "happy" expression + bounce on the 3D avatar.
 * Also triggers subtle haptic feedback via Web Vibration API.
 */
export function playerEmote() {
  gameClient.sendInput({
    type: "emote",
  });
  triggerHapticFeedback(15);
}

/**
 * Determines whether a tap/click event target is a background area
 * rather than an interactive UI control (button, input, link, tab, modal, etc.).
 */
export function isBackgroundTap(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const interactiveSelector = [
    "button",
    "input",
    "textarea",
    "select",
    "a",
    "label",
    "summary",
    "option",
    '[role="button"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="tab"]',
    '[role="menuitem"]',
    '[role="link"]',
    '[role="slider"]',
    '[role="dialog"]',
    ".btn",
    ".tab",
    ".cursor-pointer",
    ".interactive",
    ".modal-box",
    "dialog",
    "audio",
    "video",
    "canvas",
    "[data-no-emote]",
  ].join(",");

  if (target.closest(interactiveSelector)) {
    return false;
  }

  try {
    const style = window.getComputedStyle(target);
    if (style.cursor === "pointer") {
      return false;
    }
  } catch {
    // Ignore error if computed style read fails
  }

  return true;
}

