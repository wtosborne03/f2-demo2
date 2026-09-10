<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import JoystickController from "joystick-controller";
    import { gameClient, gameState } from "$lib/wsapi/gameClient";

    // --- Config ---
    const SEND_INTERVAL_MS = 1000 / 60; // 60 Hz send rate
    const DEADZONE = 0.08; // 8% of maxRange — ignore tiny drift
    const EDGE_THRESHOLD = 0.92; // normalized value considered "at the edge"
    const HAPTIC_DURATION_MS = 15; // short sharp buzz
    const HAPTIC_COOLDOWN_MS = 80; // prevent buzz spam when sliding along the rim

    // --- State ---
    // Dynamic joystick sizing
    let maxRange = 90;

    // Raw values from the joystick library (pixels, -maxRange..+maxRange)
    let rawX = 0;
    let rawY = 0;

    // Keyboard state tracking
    const pressedKeys = new Set<string>();

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
    let staticJoystick: JoystickController | null = null;
    let rafId = 0;
    let lastSendTime = 0;

    function initJoystick() {
        if (staticJoystick) {
            staticJoystick.destroy();
        }

        // Cap joystick base size to screen width up to a small screen (~420px max)
        const screenWidth = window.innerWidth;
        const availableWidth = Math.min(screenWidth * 0.85, 420);

        const radius = availableWidth / 2;
        maxRange = radius * 0.75;
        const joystickRadius = radius * 0.33;

        staticJoystick = new JoystickController(
            {
                maxRange,
                level: 10,
                radius,
                joystickRadius,
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
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
            e.preventDefault();
            pressedKeys.add(e.key);
        }
    }

    function handleKeyUp(e: KeyboardEvent) {
        if (
            ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)
        ) {
            e.preventDefault();
            pressedKeys.delete(e.key);
        }
    }

    function handleResize() {
        initJoystick();
    }

    onMount(() => {
        initJoystick();
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("resize", handleResize);

        lastSendTime = performance.now();
        rafId = requestAnimationFrame(sendLoop);
    });

    function applyDeadzone(value: number, range: number): number {
        const normalized = value / range;
        if (Math.abs(normalized) < DEADZONE) return 0;
        const sign = Math.sign(normalized);
        const rescaled = (Math.abs(normalized) - DEADZONE) / (1 - DEADZONE);
        return sign * Math.min(rescaled, 1);
    }

    function sendLoop(now: number) {
        rafId = requestAnimationFrame(sendLoop);

        // Throttle to SEND_INTERVAL_MS with 1ms tolerance margin
        if (now - lastSendTime < SEND_INTERVAL_MS - 1) return;
        lastSendTime = now;

        // Process keyboard input
        let keyX = 0;
        let keyY = 0;
        if (pressedKeys.has("ArrowLeft")) keyX -= 1;
        if (pressedKeys.has("ArrowRight")) keyX += 1;
        if (pressedKeys.has("ArrowUp")) keyY += 1;
        if (pressedKeys.has("ArrowDown")) keyY -= 1;

        // Normalize diagonal keyboard vectors so diagonals don't move faster (sqrt(2))
        if (keyX !== 0 && keyY !== 0) {
            const invMag = 1 / Math.SQRT2;
            keyX *= invMag;
            keyY *= invMag;
        }

        // Apply deadzone to touch/mouse raw joystick values
        const joyNormX = applyDeadzone(rawX, maxRange);
        const joyNormY = applyDeadzone(rawY, maxRange);

        // Prefer keyboard when active, fallback to touch/mouse
        if (pressedKeys.size > 0) {
            normX = keyX;
            normY = keyY;
        } else {
            normX = joyNormX;
            normY = joyNormY;
        }

        // Quantize to reduce network noise (2 decimal places)
        const qx = Math.round(normX * 100) / 100;
        const qy = Math.round(normY * 100) / 100;

        // Only send if value changed
        if (qx !== sentX || qy !== sentY) {
            sentX = qx;
            sentY = qy;
            gameClient.sendPlayerInput("jd", {
                x: qx,
                y: qy,
                p: false,
            });
        }

        // Haptic feedback when joystick or keys hit full deflection
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
            if (navigator.vibrate) {
                navigator.vibrate(HAPTIC_DURATION_MS);
            }
        }

        wasAtEdge = isAtEdge;
    }

    onDestroy(() => {
        if (rafId) cancelAnimationFrame(rafId);
        if (staticJoystick) staticJoystick.destroy();
        if (typeof window !== "undefined") {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("resize", handleResize);
        }
    });
</script>

<div class="h-full w-full joy-bg fixed top-0 left-0">
    <div
        bind:this={joystickContainer}
        class="w-[85vw] h-[85vw] max-w-[420px] max-h-[420px] opacity-100 border-8 fixed rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
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
