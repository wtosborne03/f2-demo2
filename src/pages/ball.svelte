<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { gameClient, gameState } from "$lib/wsapi/gameClient";

    // --- Config ---
    const SEND_INTERVAL_MS = 1000 / 60; // 60 Hz send rate
    const DEADZONE = 0.08; // 8% of maxRange — ignore tiny drift
    const EDGE_THRESHOLD = 0.92; // normalized value considered "at the edge"
    const HAPTIC_DURATION_MS = 15; // short sharp buzz
    const HAPTIC_COOLDOWN_MS = 80; // prevent buzz spam when sliding along the rim

    // Ergonomic physical travel radius: comfortable for thumbs without stretching
    const MAX_RANGE = 52; 

    // --- State ---
    let touchActive = false;
    let originX = 0;
    let originY = 0;
    let currentX = 0;
    let currentY = 0;
    let activeTouchId: number | null = null;

    // Relative offset from origin (-MAX_RANGE..+MAX_RANGE)
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

    let touchArea: HTMLElement;
    let rafId = 0;
    let lastSendTime = 0;

    function handlePointerDown(e: PointerEvent) {
        // Only accept primary pointer (or first active finger)
        if (activeTouchId !== null) return;
        activeTouchId = e.pointerId;
        touchActive = true;

        originX = e.clientX;
        originY = e.clientY;
        currentX = e.clientX;
        currentY = e.clientY;
        rawX = 0;
        rawY = 0;

        // Capture pointer to receive move/up events even if dragged outside container/viewport
        try {
            touchArea.setPointerCapture(e.pointerId);
        } catch {
            // ignore if not supported
        }
    }

    function handlePointerMove(e: PointerEvent) {
        if (!touchActive || e.pointerId !== activeTouchId) return;

        let dx = e.clientX - originX;
        let dy = e.clientY - originY;
        const dist = Math.hypot(dx, dy);

        // "Follow-thumb" behavior: if dragged further than MAX_RANGE, slide origin towards touch
        // This prevents the thumb from getting disconnected from the control
        if (dist > MAX_RANGE) {
            const excess = dist - MAX_RANGE;
            const angle = Math.atan2(dy, dx);
            originX += Math.cos(angle) * excess;
            originY += Math.sin(angle) * excess;
            dx = Math.cos(angle) * MAX_RANGE;
            dy = Math.sin(angle) * MAX_RANGE;
        }

        currentX = originX + dx;
        currentY = originY + dy;

        // Joystick coordinate system: +x is right, +y is UP
        rawX = dx;
        rawY = -dy;
    }

    function endTouch(e: PointerEvent) {
        if (e.pointerId !== activeTouchId) return;
        touchActive = false;
        activeTouchId = null;
        rawX = 0;
        rawY = 0;
        try {
            if (touchArea.hasPointerCapture(e.pointerId)) {
                touchArea.releasePointerCapture(e.pointerId);
            }
        } catch {
            // ignore
        }
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

    onMount(() => {
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

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
        const joyNormX = applyDeadzone(rawX, MAX_RANGE);
        const joyNormY = applyDeadzone(rawY, MAX_RANGE);

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
        if (typeof window !== "undefined") {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        }
    });
</script>

<!-- Full touch capture surface -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    bind:this={touchArea}
    class="fixed inset-0 w-full h-full select-none touch-none overflow-hidden joy-bg"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={endTouch}
    onpointercancel={endTouch}
>
    <!-- Idle subtle guide when not touching -->
    {#if !touchActive}
        <div
            class="absolute bottom-12 left-1/2 -translate-x-1/2 text-center pointer-events-none opacity-40 select-none animate-pulse text-sm font-medium tracking-wide"
            style="color: {$gameState.team === 'Black' ? 'black' : 'white'};"
        >
            Touch anywhere to steer
        </div>
    {/if}

    <!-- Dynamic Floating Joystick Visual -->
    {#if touchActive}
        <!-- Base Ring (Spawned at origin) -->
        <div
            class="fixed rounded-full pointer-events-none transition-transform duration-75 ease-out shadow-2xl flex items-center justify-center"
            style="
                width: {MAX_RANGE * 2.5}px;
                height: {MAX_RANGE * 2.5}px;
                left: {originX}px;
                top: {originY}px;
                transform: translate(-50%, -50%);
                background-color: {$gameState.color || 'rgba(255, 255, 255, 0.15)'};
                border: 4px solid {$gameState.team === 'Black' ? 'black' : 'white'};
                opacity: 0.65;
            "
        >
            <!-- Center target dot -->
            <div
                class="w-3 h-3 rounded-full opacity-40"
                style="background-color: {$gameState.team === 'Black' ? 'black' : 'white'};"
            ></div>
        </div>

        <!-- Knob / Thumb Pad (Follows finger, clamped to MAX_RANGE) -->
        <div
            class="fixed rounded-full pointer-events-none shadow-lg z-50 flex items-center justify-center backdrop-blur-sm"
            style="
                width: {MAX_RANGE * 1.1}px;
                height: {MAX_RANGE * 1.1}px;
                left: {currentX}px;
                top: {currentY}px;
                transform: translate(-50%, -50%);
                background-color: {$gameState.color || 'white'};
                border: 3px solid {$gameState.team === 'Black' ? 'black' : 'white'};
                box-shadow: 0 4px 18px rgba(0,0,0,0.35);
            "
        >
            <div
                class="w-4 h-4 rounded-full opacity-60"
                style="background-color: {$gameState.team === 'Black' ? 'black' : 'white'};"
            ></div>
        </div>
    {/if}
</div>

<style>
    :global(body) {
        overscroll-behavior: none;
        user-select: none;
        -webkit-user-select: none;
    }
</style>
