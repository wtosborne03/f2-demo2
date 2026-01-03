import { gameClient } from "$lib/wsapi/gameClient";

// per-container cooldown map to avoid spamming
const lastEmoteAt = new WeakMap<HTMLElement, number>();
const COOLDOWN_MS = 1000; // 1 second cooldown

function playerEmote(event: Event) {
    if (event.target !== event.currentTarget) {
        return;
    }

    const container = event.currentTarget as HTMLElement | null;
    if (!container || typeof window === "undefined") return;

    // cooldown: ignore if triggered too soon on the same container
    const now = Date.now();
    const last = lastEmoteAt.get(container) ?? 0;
    if (now - last < COOLDOWN_MS) return;
    lastEmoteAt.set(container, now);

    // notify server immediately
    gameClient.sendInput({
        type: 'emote',
    });

    // UI feedback: ephemeral animated badge appended to the clicked container

    // derive client coordinates (supports MouseEvent and TouchEvent)
    const ev = event as MouseEvent | TouchEvent;
    let clientX = 0;
    let clientY = 0;
    if (ev instanceof MouseEvent) {
        clientX = ev.clientX;
        clientY = ev.clientY;
    } else if (ev instanceof TouchEvent && ev.changedTouches && ev.changedTouches[0]) {
        clientX = ev.changedTouches[0].clientX;
        clientY = ev.changedTouches[0].clientY;
    }

    // fixed size simplifies centering math
    const size = 56;
    const badge = document.createElement("div");
    badge.textContent = "🎉";
    Object.assign(badge.style, {
        // anchor to viewport so container layout changes can't move the badge
        position: "fixed",
        left: `${clientX}px`,
        top: `${clientY}px`,
        // use consistent percentage-based centering in transform to avoid
        // mixing units across keyframes (no px/percent interpolation)
        transform: `translate(-50%, -50%) scale(0.6)`,
        width: `${size}px`,
        height: `${size}px`,
        display: "grid",
        placeItems: "center",
        borderRadius: "9999px",
        background: "rgba(59,130,246,0.95)",
        color: "white",
        pointerEvents: "none",
        zIndex: "9999",
        willChange: "transform, opacity",
    } as Partial<CSSStyleDeclaration>);
    // append to body so badge remains stable even if container moves
    document.body.appendChild(badge);

    // animate: keep position fixed (no translate movement that changes top/left)
    // — only scale and opacity change. Use consistent translate(-50%,-50%) in
    // all keyframes to avoid interpolation between different unit types.
    const animation = badge.animate(
        [
            { transform: `translate(-50%, -50%) scale(0.6)`, opacity: 0 },
            { transform: `translate(-50%, -50%) scale(1.2)`, opacity: 1, offset: 0.2 },
            { transform: `translate(-50%, -50%) scale(2.3)`, opacity: 0, offset: 1 },
        ],
        {
            duration: 2000,
            easing: "cubic-bezier(.2,.9,.2,1)",
            fill: "forwards",
        }
    );

    animation.onfinish = () => {
        badge.remove();
        // nothing else to revert — we appended to body and didn't change container
    };
}

export { playerEmote };