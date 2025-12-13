<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { draggable } from "@neodrag/svelte";
    import type { DragEventData } from "@neodrag/svelte";
    import { player_state } from "../stores/player_state";
    import { get } from "svelte/store";
    import { gameClient } from "$lib/gameService";

    let pos = 0;
    let wakeLock: WakeLockSentinel | null = null;
    let lastSendTime = 0;

    // Local state to store latest sensor data before sending
    let sensorData = {
        alpha: 0,
        beta: 0,
        gamma: 0,
        accX: 0,
        accY: 0,
        accZ: 0,
    };

    /**
     * Requests wake lock for keeping screen on while shaking
     */
    const requestWakeLock = async () => {
        try {
            if ("wakeLock" in navigator) {
                // @ts-ignore
                wakeLock = await navigator.wakeLock.request("screen");
                wakeLock.addEventListener("release", () => {
                    console.log("Wake lock released");
                });
            }
        } catch (err) {
            console.error(`Failed to request wake lock: ${err}`);
        }
    };

    /**
     * Releases wake lock when shaking is finished
     */
    const releaseWakeLock = async () => {
        if (wakeLock) {
            try {
                await wakeLock.release();
            } catch (e) {
                console.warn("Failed releasing wake lock:", e);
            }
            wakeLock = null;
        }
    };

    // --- Improved motion detection ---
    async function requestIOSPermissionIfNeeded(): Promise<boolean> {
        const anyDM = DeviceMotionEvent as any;
        if (
            typeof anyDM !== "undefined" &&
            typeof anyDM.requestPermission === "function"
        ) {
            try {
                const resp = await anyDM.requestPermission();
                return resp === "granted";
            } catch (err) {
                console.warn("DeviceMotion requestPermission failed:", err);
                return false;
            }
        }
        // No iOS-style permission API => treat as not needed
        return true;
    }

    function probeDevicemotion(timeout = 1500): Promise<boolean> {
        return new Promise((resolve) => {
            let resolved = false;
            function handler(e: DeviceMotionEvent) {
                if (resolved) return;
                resolved = true;
                window.removeEventListener("devicemotion", handler);
                // Treat any delivered devicemotion event as success.
                resolve(true);
            }
            window.addEventListener("devicemotion", handler, { passive: true });
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    window.removeEventListener("devicemotion", handler);
                    resolve(false);
                }
            }, timeout);
        });
    }

    async function checkMotion(): Promise<boolean> {
        if (
            typeof window === "undefined" ||
            typeof DeviceMotionEvent === "undefined"
        ) {
            return false;
        }

        // Ask for permission on iOS if required
        const iosOk = await requestIOSPermissionIfNeeded();
        if (!iosOk) {
            return false;
        }

        // Probe for any devicemotion event (longer timeout to reduce false negatives)
        const hasEvent = await probeDevicemotion(1500);
        return hasEvent;
    }

    let motion = false;
    let initialPosition = { x: 0, y: 0 };
    let lastShakingDistance = 0;
    let totalShakingDistance = 0;
    let lastDragTime = 0;
    let lastMotionTime = 0;

    // Late fallback handler reference so we can remove it on destroy
    let lateHandler: ((e: DeviceMotionEvent) => void) | null = null;
    let lateHandlerTimeoutId: number | null = null;

    async function enableMotionManually() {
        // Try requesting permission (iOS) and enabling motion handlers on user gesture
        const ok = await requestIOSPermissionIfNeeded();
        if (!ok) {
            console.warn("User did not grant motion permission.");
            return;
        }
        // Add full listeners
        if (!motion) {
            motion = true;
            window.addEventListener("deviceorientation", handleOrientation);
            window.addEventListener("devicemotion", handleMotion, {
                passive: true,
            });
            // Clean up any late handler if present
            if (lateHandler) {
                window.removeEventListener("devicemotion", lateHandler);
                lateHandler = null;
            }
            if (lateHandlerTimeoutId) {
                clearTimeout(lateHandlerTimeoutId);
                lateHandlerTimeoutId = null;
            }
        }
    }

    onMount(() => {
        checkMotion().then((value) => {
            motion = value;
            if (motion) {
                window.addEventListener("deviceorientation", handleOrientation);
                window.addEventListener("devicemotion", handleMotion, {
                    passive: true,
                });
            } else {
                // Start a late fallback listener that will enable motion if a devicemotion arrives later
                lateHandler = (e: DeviceMotionEvent) => {
                    // first devicemotion -> enable motion mode and add full handlers
                    if (!motion) {
                        motion = true;
                        window.addEventListener(
                            "deviceorientation",
                            handleOrientation,
                        );
                        window.addEventListener("devicemotion", handleMotion, {
                            passive: true,
                        });
                    }
                    if (lateHandler) {
                        window.removeEventListener("devicemotion", lateHandler);
                        lateHandler = null;
                    }
                };
                window.addEventListener("devicemotion", lateHandler, {
                    passive: true,
                });
                // Remove the late handler after a reasonable period to avoid leaking listeners
                lateHandlerTimeoutId = window.setTimeout(() => {
                    if (lateHandler) {
                        window.removeEventListener("devicemotion", lateHandler);
                        lateHandler = null;
                    }
                    lateHandlerTimeoutId = null;
                }, 15000); // 15s fallback window
            }
        });
        requestWakeLock();
    });

    const sendProgress = (progress: number) => {
        gameClient.sendPlayerInput({
            payload: {
                $case: "shakeProgress",
                shakeProgress: {
                    alpha: 0,
                    beta: 0,
                    gamma: 0,
                    accX: 0,
                    accY: 0,
                    accZ: 0,
                    progress: progress,
                    motion: false,
                },
            },
        });
    };

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
        const timeDifference = currentTime - lastDragTime;
        const velocity =
            timeDifference > 0 ? distanceMoved / timeDifference : 0;

        totalShakingDistance += distanceMoved;

        sendProgress(currentPosition.y * 0.05);

        initialPosition = currentPosition; // Update initial position to current position
        lastDragTime = currentTime; // Update last drag time
    }

    function handleOrientation(event: DeviceOrientationEvent) {
        // Capture rotation
        sensorData.alpha = event.alpha ?? 0;
        sensorData.beta = event.beta ?? 0;
        sensorData.gamma = event.gamma ?? 0;
        trySend();
    }

    function handleMotion(event: DeviceMotionEvent) {
        // Prefer raw acceleration; fall back to accelerationIncludingGravity if needed
        const acc = event.acceleration ?? event.accelerationIncludingGravity;
        if (acc) {
            sensorData.accX = acc.x ?? 0;
            sensorData.accY = acc.y ?? 0;
            sensorData.accZ = acc.z ?? 0;
        }
        lastMotionTime = Date.now();
        trySend();
    }

    // --- Throttled Sender ---
    function trySend() {
        const now = Date.now();
        // Limit to ~100 updates per second maximum; your previous used 10ms (~100Hz),
        // but comment said ~20 updates/sec. We'll keep a sane 50ms (20Hz) throttle.
        if (now - lastSendTime > 10) {
            gameClient.sendPlayerInput({
                payload: {
                    $case: "shakeProgress", // Ensure this exists in your protobuf/types
                    shakeProgress: { ...sensorData, progress: 0, motion: true },
                },
            });
            lastSendTime = now;
        }
    }

    onDestroy(() => {
        if (typeof window !== "undefined") {
            window.removeEventListener("deviceorientation", handleOrientation);
            window.removeEventListener("devicemotion", handleMotion);
            if (lateHandler) {
                window.removeEventListener("devicemotion", lateHandler);
                lateHandler = null;
            }
            if (lateHandlerTimeoutId) {
                clearTimeout(lateHandlerTimeoutId);
                lateHandlerTimeoutId = null;
            }
            releaseWakeLock();
        }
    });
</script>

<div class="container h-full mx-auto flex flex-col justify-center items-center">
    {#if motion}
        <div class="border-4 p-3" style:border-color={get(player_state).color}>
            Shake your device to play 🫨
        </div>
    {:else}
        <div class="flex flex-col items-center gap-4">
            <div>Drag the duck around to Shake it</div>

            <div
                use:draggable={{
                    axis: "y",
                    bounds: "body",
                    onDrag: onDrag,
                    onDragStart: onDragStart,
                }}
                class="text-9xl"
            >
                <svg
                    height="7rem"
                    width="7rem"
                    version="1.1"
                    id="_x32_"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    viewBox="0 0 512 512"
                    xml:space="preserve"
                >
                    <g>
                        <path
                            style:fill={`${get(player_state).color}`}
                            class="st0"
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

            <button
                on:click={enableMotionManually}
                class="px-4 py-2 rounded bg-blue-600 text-white"
                aria-label="Enable motion controls"
            >
                Enable motion controls
            </button>
            <div class="text-sm text-gray-500">
                If your device didn't enable motion automatically, tap the
                button to allow motion sensors.
            </div>
        </div>
    {/if}
</div>
