<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { gameClient, gameState } from "$lib/wsapi/gameClient";

    // --- Config ---
    const SEND_INTERVAL_MS = 1000 / 60; // 60 Hz send rate
    const DEADZONE = 0.08; // 8% of maxRange — ignore tiny drift
    const EDGE_THRESHOLD = 0.92; // normalized value considered "at the edge"
    const HAPTIC_DURATION_MS = 15; // short sharp buzz
    const HAPTIC_COOLDOWN_MS = 80; // prevent buzz spam when sliding along the rim

    // Ergonomic physical travel radius: comfortable travel, enlarged slightly per request
    const MAX_RANGE = 70; 

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
    let baseEl: HTMLElement;
    let knobEl: HTMLElement;
    let rafId = 0;
    let lastSendTime = 0;

    function handlePointerDown(e: PointerEvent) {
        if (activeTouchId !== null) return;
        activeTouchId = e.pointerId;
        touchActive = true;

        originX = e.clientX;
        originY = e.clientY;
        currentX = e.clientX;
        currentY = e.clientY;
        rawX = 0;
        rawY = 0;

        if (knobEl) {
            knobEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(1)`;
            knobEl.style.opacity = "1";
        }

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

        if (dist > MAX_RANGE) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * MAX_RANGE;
            dy = Math.sin(angle) * MAX_RANGE;
        }

        currentX = originX + dx;
        currentY = originY + dy;

        // Directly update DOM transform with hardware acceleration for silky 60/120fps
        if (knobEl) {
            knobEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(1)`;
        }

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

        if (knobEl) {
            knobEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%) scale(0.2)`;
            knobEl.style.opacity = "0";
        }

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
        originX = window.innerWidth / 2;
        originY = window.innerHeight / 2;
        currentX = originX;
        currentY = originY;

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
    class="fixed inset-0 w-full h-full select-none touch-none overflow-hidden bg-neutral-950"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={endTouch}
    onpointercancel={endTouch}
>
    <!-- 
      Morphing Canvas / Background:
      - Idle: fills 100vw x 100vh with 0px border radius (full screen player color).
      - Active: collapses smoothly into a circular joystick base of (MAX_RANGE * 2.5)px centered at (originX, originY).
      - Released: smoothly expands back out from that point across the entire screen.
    -->
    <div
        class="absolute pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center overflow-hidden"
        style="
            background-color: {$gameState.color || '#3b82f6'};
            border: {touchActive ? '4px' : '0px'} solid {$gameState.team === 'Black' ? 'black' : 'white'};
            left: {originX}px;
            top: {originY}px;
            width: {touchActive ? (MAX_RANGE * 2.5) + 'px' : '220vmax'};
            height: {touchActive ? (MAX_RANGE * 2.5) + 'px' : '220vmax'};
            border-radius: {touchActive ? '9999px' : '0px'};
            transform: translate(-50%, -50%);
            box-shadow: {touchActive ? '0 20px 40px -10px rgba(0,0,0,0.6), inset 0 2px 6px rgba(255,255,255,0.2)' : 'none'};
            z-index: 10;
        "
    >
        <!-- Idle instruction text on full screen, fades out when morphing -->
        <div
            class="transition-opacity duration-150 pointer-events-none select-none text-center px-6"
            style="
                opacity: {touchActive ? 0 : 0.85};
                color: {$gameState.team === 'Black' ? 'black' : 'white'};
            "
        >
            <div class="text-2xl font-bold tracking-tight mb-1 drop-shadow-sm">Touch anywhere to steer</div>
            <div class="text-sm font-medium opacity-70">Joystick anchors to your thumb</div>
        </div>

        <!-- Center reference dot when collapsed as joystick base -->
        {#if touchActive}
            <div
                class="w-3 h-3 rounded-full opacity-40 animate-pulse pointer-events-none"
                style="background-color: {$gameState.team === 'Black' ? 'black' : 'white'};"
            ></div>
        {/if}
    </div>

    <!-- Joystick Knob (Directly updated on pointermove for 0ms input latency) -->
    <div
        bind:this={knobEl}
        class="fixed top-0 left-0 rounded-full pointer-events-none shadow-2xl z-30 flex items-center justify-center will-change-transform"
        style="
            width: {MAX_RANGE * 1.15}px;
            height: {MAX_RANGE * 1.15}px;
            opacity: 0;
            transform: translate3d(0, 0, 0) translate(-50%, -50%) scale(0.2);
            transition: opacity 120ms ease-out, border 120ms ease-out;
            background-color: {$gameState.team === 'Black' ? '#18181b' : '#ffffff'};
            border: 3px solid {$gameState.team === 'Black' ? 'white' : 'black'};
            box-shadow: 0 10px 25px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.4);
        "
    >
        <!-- Inner accent dot with player's color -->
        <div
            class="w-5 h-5 rounded-full"
            style="background-color: {$gameState.color || '#3b82f6'};"
        ></div>
    </div>
</div>

<style>
    :global(body) {
        overscroll-behavior: none;
        user-select: none;
        -webkit-user-select: none;
    }
</style>
