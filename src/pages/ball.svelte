<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import JoystickController from "joystick-controller";
    import { gameClient, gameState } from "$lib/wsapi/gameClient";

    // --- Config ---
    const SEND_INTERVAL_MS = 1000 / 30; // 30 Hz send rate
    const DEADZONE = 0.08; // 8% of maxRange — ignore tiny drift
    const EDGE_THRESHOLD = 0.92; // normalized value considered "at the edge"
    const HAPTIC_DURATION_MS = 15; // short sharp buzz
    const HAPTIC_COOLDOWN_MS = 80; // prevent buzz spam when sliding along the rim

    // --- State ---
    // Raw values from the joystick library (pixels, -maxRange..+maxRange)
    let rawX = 0;
    let rawY = 0;

    // Normalized values after deadzone (-1..+1)
    let normX = 0;
    let normY = 0;

    // Last values actually sent to the server
    let sentX = 0;
    let sentY = 0;

    // Haptic state
    let wasAtEdge = false;
    let lastHapticTime = 0;

    let joystickContainer: HTMLElement;
    let staticJoystick: JoystickController;
    let rafId = 0;
    let lastSendTime = 0;

    onMount(() => {
        staticJoystick = new JoystickController(
            {
                maxRange: 90,
                level: 10,
                radius: 120,
                joystickRadius: 40,
                opacity: 0.5,
                leftToRight: false,
                bottomToUp: true,
                containerClass: "joystick-container rounded-full",
                controllerClass: "joystick-controller",
                joystickClass: "joystick",
                distortion: true,
                x: "50%",
                y: "50%",
                mouseClickButton: "ALL",
                hideContextMenu: false,
            },
            ({ x, y }) => {
                rawX = x;
                rawY = y;
            },
        );

        lastSendTime = performance.now();
        rafId = requestAnimationFrame(sendLoop);
    });

    function applyDeadzone(value: number, maxRange: number): number {
        const normalized = value / maxRange;
        if (Math.abs(normalized) < DEADZONE) return 0;
        // Rescale so the usable range still maps to -1..+1
        const sign = Math.sign(normalized);
        const rescaled = (Math.abs(normalized) - DEADZONE) / (1 - DEADZONE);
        return sign * Math.min(rescaled, 1);
    }

    function sendLoop(now: number) {
        rafId = requestAnimationFrame(sendLoop);

        // Throttle to SEND_INTERVAL_MS
        if (now - lastSendTime < SEND_INTERVAL_MS) return;
        lastSendTime = now;

        // Apply deadzone and normalize to -1..+1
        normX = applyDeadzone(rawX, 90);
        normY = applyDeadzone(rawY, 90);

        // Quantize to reduce network noise (2 decimal places)
        const qx = Math.round(normX * 100) / 100;
        const qy = Math.round(normY * 100) / 100;

        // Only send if value actually changed
        if (qx !== sentX || qy !== sentY) {
            sentX = qx;
            sentY = qy;
            gameClient.sendPlayerInput("jd", {
                x: qx,
                y: qy,
                p: false,
            });
        }

        // Haptic feedback when joystick hits the edge
        triggerEdgeHaptic(qx, qy, now);
    }

    function triggerEdgeHaptic(x: number, y: number, now: number) {
        const magnitude = Math.hypot(x, y);
        const isAtEdge = magnitude >= EDGE_THRESHOLD;

        if (
            isAtEdge &&
            !wasAtEdge &&
            now - lastHapticTime > HAPTIC_COOLDOWN_MS
        ) {
            lastHapticTime = now;
            // Use the Vibration API — safe to call even on devices that don't support it
            if (navigator.vibrate) {
                navigator.vibrate(HAPTIC_DURATION_MS);
            }
        }

        wasAtEdge = isAtEdge;
    }

    onDestroy(() => {
        if (rafId) cancelAnimationFrame(rafId);
        if (staticJoystick) staticJoystick.destroy();
    });
</script>

<div class="h-full w-full joy-bg fixed top-0 left-0">
    <div
        bind:this={joystickContainer}
        class="w-60 h-60 opacity-100 border-8 fixed rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        style="background-color: {$gameState.color}; border-color: {$gameState.team ===
        'Black'
            ? 'black'
            : $gameState.team === 'White'
              ? 'white'
              : 'transparent'};"
    ></div>
</div>

<style>
    :global([class*="joystick-container-"]) {
        touch-action: none !important;
        z-index: 50 !important;
    }
    :global([class*="joystick-controller-"]),
    :global([class*="joystick-"]) {
        touch-action: none !important;
    }
</style>
