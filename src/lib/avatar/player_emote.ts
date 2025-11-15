import { sendMessage } from "$lib/webSocketService";

function playerEmote(event: Event) {
    if (event.target !== event.currentTarget) {
        return;
    }

    sendMessage({
        type: "game",
        data: {
            type: "emote",
        },
    });

    // UI feedback: ephemeral animated badge appended to the clicked container
    const container = event.currentTarget as HTMLElement | null;
    if (!container || typeof window === "undefined") return;

    // ensure container can position absolutely-positioned child
    const prevInlinePos = container.style.position;
    const computedPos = getComputedStyle(container).position;
    if (computedPos === "static") {
        container.style.position = "relative";
    }

    // get tap/click position relative to container
    const rect = container.getBoundingClientRect();
    const x = (event as MouseEvent).clientX - rect.left;
    const y = (event as MouseEvent).clientY - rect.top;

    const badge = document.createElement("div");
    badge.textContent = "🎉";
    Object.assign(badge.style, {
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%) scale(0.6)",
        width: "56px",
        height: "56px",
        display: "grid",
        placeItems: "center",
        borderRadius: "9999px",
        background: "rgba(59,130,246,0.95)",
        color: "white",
        pointerEvents: "none",
        zIndex: "9999",
    });

    container.appendChild(badge);

    // animate: pop at tap location, then float up and fade
    const animation = badge.animate(
        [
            { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
            { transform: "translate(-50%, -120%) scale(1.2)", opacity: 1, offset: 0.2 },
            { transform: "translate(-50%, -150%) scale(1.0)", opacity: 1, offset: 0.3 },
            { transform: "translate(-50%, -750%) scale(2.3)", opacity: 0, offset: 1 }, // float up by adjusting translateY
        ],
        {
            duration: 4000,
            easing: "cubic-bezier(.2,.9,.2,1)",
            fill: "forwards",
        }
    );

    animation.onfinish = () => {
        badge.remove();
        // revert inline position if we set it here
        if (computedPos === "static") {
            container.style.position = prevInlinePos;
        }
    };
}

export { playerEmote };