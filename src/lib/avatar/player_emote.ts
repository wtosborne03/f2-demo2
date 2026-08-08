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
 * Determines whether a tap/click event target is strictly an unadorned background area
 * rather than a UI element (card, panel, text, button, input, link, tab, modal, etc.).
 */
export function isBackgroundTap(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  // Comprehensive list of UI elements, typography, interactive controls, and containers
  const uiElementSelector = [
    // Interactive controls & media
    "button",
    "input",
    "textarea",
    "select",
    "a",
    "label",
    "summary",
    "option",
    "svg",
    "path",
    "img",
    "canvas",
    "video",
    "audio",
    "iframe",
    "dialog",

    // ARIA roles
    "[role]",

    // UI layout containers & component cards
    ".card",
    ".card-body",
    ".modal-box",
    ".modal",
    ".drawer",
    ".panel",
    ".box",
    ".btn",
    ".tab",
    ".navbar",
    ".app-bar",
    ".sidebar",
    ".footer",
    ".alert",
    ".badge",
    ".chat",
    ".stat",
    ".menu",
    ".toast",
    ".tooltip",
    ".join",
    ".avatar",
    ".kbd",

    // Semantic HTML UI content elements
    "section",
    "article",
    "header",
    "footer",
    "nav",
    "aside",
    "form",
    "fieldset",
    "ul",
    "ol",
    "li",
    "table",
    "tr",
    "td",
    "th",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "span",
    "b",
    "strong",
    "em",
    "i",
    "small",
    "blockquote",
    "code",
    "pre",

    // Custom app classes & attributes
    ".interactive",
    ".cursor-pointer",
    "[data-no-emote]",
  ].join(",");

  // If the target is or is inside any UI element/container, it is NOT a background tap
  if (target.closest(uiElementSelector)) {
    return false;
  }

  // Check computed cursor style (pointer, text, grab, etc.)
  try {
    const style = window.getComputedStyle(target);
    if (style.cursor !== "auto" && style.cursor !== "default") {
      return false;
    }
  } catch {
    // Ignore error
  }

  return true;
}


