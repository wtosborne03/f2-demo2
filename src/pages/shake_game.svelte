<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { draggable } from "@neodrag/svelte";
    import type { DragEventData } from "@neodrag/svelte";
    import { player_state } from "../stores/player_state";
    import { get } from "svelte/store";
    import { gameClient } from "$lib/gameService";

    // Motion state
    let motionSupported = false;
    let needPermission = false; // iOS devices
    let motionEnabled = false; // whether we successfully started listening
    let permissionStatus: "unknown" | "granted" | "denied" | "prompt" =
        "unknown";
    let statusMessage = "";

    // Drag state (fallback)
    let initialPosition = { x: 0, y: 0 };
    let lastDragTime = 0;

    // Motion processing state
    let lastMotionTime = 0;
    let totalShakingDistance = 0;
    let lastSentAt = 0;
    const SEND_THROTTLE_MS = 50;

    // small smoothing window to avoid tiny noise
    const MIN_PROGRESS = 0;
    const MAX_PROGRESS = 10; // tune this for a comfortable scale

    // Utility: send progress to server (throttled)
    function sendProgress(progress: number) {
        const now = Date.now();
        if (now - lastSentAt < SEND_THROTTLE_MS) return;
        lastSentAt = now;

        // clamp & normalize (optional)
        const clamped = Math.max(
            MIN_PROGRESS,
            Math.min(MAX_PROGRESS, Math.abs(progress)),
        );
        // map to a smaller range if necessary; here we just send raw clamped value
        gameClient.sendPlayerInput({
            payload: {
                $case: "shakeProgress",
                shakeProgress: {
                    progress: clamped,
                    motion: motionEnabled,
                },
            },
        });
    }

    // Motion handler
    function handleMotion(event: DeviceMotionEvent) {
        const acc = event.accelerationIncludingGravity || event.acceleration;
        if (!acc) return;

        const ax = acc.x ?? 0;
        const ay = acc.y ?? 0;
        const az = acc.z ?? 0;

        // Compute a simple intensity metric
        const intensity = Math.sqrt(ax * ax + ay * ay + az * az);

        // accumulate some stats
        const now = Date.now();
        const dt = Math.max(1, now - lastMotionTime);
        totalShakingDistance += intensity;
        lastMotionTime = now;

        // Use the y-axis sign to move UI if needed (not required)
        // send normalized intensity as progress
        sendProgress(intensity);
    }

    // Test whether device motion events fire without explicit permission (useful on Android/Chrome)
    function probeMotionOnce(timeout = 400): Promise<boolean> {
        return new Promise((resolve) => {
            let resolved = false;
            function onProbe(e: DeviceMotionEvent) {
                if (e.accelerationIncludingGravity || e.acceleration) {
                    cleanup();
                    resolved = true;
                    resolve(true);
                }
            }
            function cleanup() {
                window.removeEventListener("devicemotion", onProbe);
                clearTimeout(timer);
            }
            window.addEventListener("devicemotion", onProbe);
            const timer = setTimeout(() => {
                if (!resolved) {
                    cleanup();
                    resolve(false);
                }
            }, timeout);
        });
    }

    // Attempt to enable motion sensors. This MUST be called from a user gesture on iOS to request permission.
    async function enableMotionSensors() {
        if (!motionSupported) {
            statusMessage =
                "Motion sensors are not supported on this device/browser.";
            return;
        }

        // iOS 13+ requires a user gesture and explicit permission call
        if (needPermission) {
            try {
                // @ts-ignore - DeviceMotionEvent.requestPermission is non-standard typing
                const resp = await (
                    DeviceMotionEvent as any
                ).requestPermission();
                permissionStatus = resp === "granted" ? "granted" : "denied";
                if (permissionStatus === "granted") {
                    window.addEventListener("devicemotion", handleMotion);
                    motionEnabled = true;
                    statusMessage = "Motion enabled — shake your device!";
                } else {
                    statusMessage =
                        "Permission denied for motion sensors. Use the drag fallback.";
                    motionEnabled = false;
                }
            } catch (err) {
                permissionStatus = "denied";
                statusMessage =
                    "Could not request permission for motion sensors. Try the drag fallback.";
                motionEnabled = false;
            }
            return;
        }

        // Non-iOS: some Android browsers require a user gesture for sensors to begin; try probing
        const fired = await probeMotionOnce(800);
        if (fired) {
            // events are already firing; just add our handler
            window.addEventListener("devicemotion", handleMotion);
            motionEnabled = true;
            statusMessage = "Motion enabled — shake your device!";
        } else {
            // As a fallback, start listening now (some browsers will start delivering after listener is attached)
            window.addEventListener("devicemotion", handleMotion);
            // Give it a short time to observe events
            const observed = await probeMotionOnce(1000);
            if (observed) {
                motionEnabled = true;
                statusMessage = "Motion enabled — shake your device!";
            } else {
                // Not receiving events; inform user and show drag fallback
                motionEnabled = false;
                statusMessage =
                    "Motion sensors didn't start. Please use the duck drag fallback, or try enabling sensors in your browser settings.";
            }
        }
    }

    // Drag handlers (fallback for touch/mouse)
    function onDragStart(data: DragEventData) {
        initialPosition = { x: data.offsetX, y: data.offsetY };
        lastDragTime = Date.now();
    }

    function onDrag(data: DragEventData) {
        const currentPosition = { x: data.offsetX, y: data.offsetY };
        const distanceMoved = Math.sqrt(
            Math.pow(currentPosition.x - initialPosition.x, 2) +
                Math.pow(currentPosition.y - initialPosition.y, 2),
        );
        const currentTime = Date.now();
        const timeDifference = Math.max(1, currentTime - lastDragTime);
        const velocity = distanceMoved / timeDifference;

        // use vertical delta as a simple progress proxy
        const progress = Math.abs(currentPosition.y - initialPosition.y) * 0.05;
        totalShakingDistance += distanceMoved;
        sendProgress(progress);

        initialPosition = currentPosition;
        lastDragTime = currentTime;
    }

    // Lifecycle
    onMount(() => {
        motionSupported = typeof DeviceMotionEvent !== "undefined";
        // detect if API requires explicit permission (iOS)
        try {
            needPermission =
                motionSupported &&
                typeof (DeviceMotionEvent as any).requestPermission ===
                    "function";
        } catch {
            needPermission = false;
        }

        // By default, for non-iOS try to auto-probe motion. But don't request permission automatically on iOS.
        if (!needPermission && motionSupported) {
            // Non-blocking probe to detect if events fire automatically
            probeMotionOnce(600).then((fired) => {
                if (fired) {
                    // Start listening directly
                    window.addEventListener("devicemotion", handleMotion);
                    motionEnabled = true;
                    statusMessage = "Motion enabled — shake your device!";
                } else {
                    // Not firing yet; wait for user to click "Enable" (some Android browsers require a user gesture)
                    motionEnabled = false;
                    statusMessage =
                        "Tap enable to start motion sensors (required on some browsers).";
                }
            });
        } else if (!motionSupported) {
            statusMessage = "No motion sensor support in this browser.";
        } else {
            // iOS: require explicit permission via button (user gesture)
            motionEnabled = false;
            statusMessage = "Tap to enable motion access (required on iOS).";
        }
    });

    onDestroy(() => {
        window.removeEventListener("devicemotion", handleMotion);
    });
</script>

<div
    class="container h-full mx-auto flex flex-col justify-center items-center gap-4"
>
    <div class="panel border-2" style="border-color: {get(player_state).color}">
        {#if motionEnabled}
            <div>Shake your device to play 🫨</div>
            <div class="mt-2 text-sm text-gray-600">{statusMessage}</div>
        {:else}
            <div class="mb-2">
                {#if needPermission}
                    <div>Please enable Motion access (iOS):</div>
                {:else if motionSupported}
                    <div>
                        Enable motion sensors to shake — or use the drag
                        fallback.
                    </div>
                {:else}
                    <div>
                        Motion sensors not available — use the drag fallback.
                    </div>
                {/if}
            </div>

            <div class="flex gap-2 justify-center items-center">
                <button class="btn" on:click={() => enableMotionSensors()}>
                    Enable Motion Sensors
                </button>
                <button
                    class="btn"
                    on:click={() => {
                        // quick fallback: mark motion as disabled so user uses drag
                        motionEnabled = false;
                        statusMessage = "Using drag fallback.";
                    }}
                    style="background-color: #10B981"
                >
                    Use Drag Fallback
                </button>
            </div>

            <div class="mt-2 text-sm text-gray-600">{statusMessage}</div>
        {/if}
    </div>

    <!-- Always show the duck so users have a fallback to interact (also allows hybrid use) -->
    <div
        class="duck"
        use:draggable={{
            axis: "y",
            bounds: "body",
            onDrag: onDrag,
            onDragStart: onDragStart,
        }}
    >
        <svg
            height="7rem"
            width="7rem"
            version="1.1"
            id="_x32_"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            xml:space="preserve"
        >
            <g>
                <path
                    fill={get(player_state).color}
                    d="M442.973,250.491c-25.635,18.05-196.165,53.474-141.134-74.936c3.975-11.693,6.732-29.452,6.732-42.457
     c0-64.839-53.389-117.403-119.24-117.403c-50.361,0-93.398,30.764-110.867,74.224c-34.196,6.826-42.062-6.929-48.861-22.794
     C22.261,50.005,3.509,54.898,0.255,76.915c-2.288,15.462,10.727,57.347,44.004,70.52c-9.423,4.482-17.365,10.671-24.444,18.754
     c-9.507,10.877,2.654,29.198,16.147,24.566c12.733-4.37,32.433-6.001,45.419-6.358c5.814,13.109,13.09,24.398,19.972,33.568
     c7.351,9.799-3.319,16.916-25.936,53.812c-30.979,50.549-35.874,117.403,2.992,165.822
     c46.497,57.937,139.418,58.706,242.137,58.706c141.998,0,178.706-146.076,188.466-205.456
     C521.529,214.702,493.813,214.702,442.973,250.491z M153.119,131.945c-10.802,0-19.559-8.758-19.559-19.569
     c0-10.802,8.758-19.569,19.559-19.569c10.811,0,19.569,8.767,19.569,19.569C172.688,123.187,163.93,131.945,153.119,131.945z"
                />
            </g>
        </svg>
    </div>
</div>

<style>
    .panel {
        border-radius: 8px;
        padding: 12px;
        text-align: center;
    }
    .btn {
        background-color: #2563eb; /* blue-600 */
        color: white;
        padding: 8px 14px;
        border-radius: 6px;
        cursor: pointer;
        border: none;
        font-weight: 600;
    }
    .btn:active {
        transform: translateY(1px);
    }
    .duck {
        touch-action: none; /* required for some drag libraries on touch devices */
        user-select: none;
    }
</style>
