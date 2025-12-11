<script lang="ts">
    import { onMount } from "svelte";
    import { gameClient } from "$lib/gameService";
    import { sendMessage } from "$lib/webSocketService";

    // Send confirm to server
    const confirm = () => {
        gameClient.sendPlayerInput({
            payload: {
                $case: "confirm",
                confirm: {},
            },
        });
    };

    // UI state
    let showButton = false;
    let message: string | null = null;
    let checking = true;

    type PermissionResult = "granted" | "denied" | "prompt" | "not-supported";

    // Quick runtime/platform helpers
    const supportsDeviceMotionEvent = () =>
        typeof DeviceMotionEvent !== "undefined";
    const supportsDeviceOrientationEvent = () =>
        typeof DeviceOrientationEvent !== "undefined";
    const supportsGenericSensor = () =>
        typeof (window as any).Accelerometer === "function";
    const hasIOSRequestPermission = () =>
        typeof (DeviceMotionEvent as any)?.requestPermission === "function";

    // Try a cheap runtime test: attach a temporary devicemotion listener and see if it fires.
    async function probeDeviceMotionEvent(
        timeoutMs = 300,
    ): Promise<PermissionResult> {
        if (!supportsDeviceMotionEvent() && !supportsDeviceOrientationEvent()) {
            return "not-supported";
        }

        return new Promise((resolve) => {
            let handled = false;
            const onMotion = (ev: DeviceMotionEvent) => {
                if (handled) return;
                handled = true;
                window.removeEventListener("devicemotion", onMotion);
                resolve("granted");
            };
            window.addEventListener("devicemotion", onMotion);
            setTimeout(() => {
                if (handled) return;
                window.removeEventListener("devicemotion", onMotion);
                resolve("denied");
            }, timeoutMs);
        });
    }

    // Try using the Permissions API for accelerometer/gyroscope if available.
    async function checkPermissionsAPI(): Promise<PermissionResult> {
        const nav: any = navigator;
        if (!nav.permissions || typeof nav.permissions.query !== "function") {
            return "not-supported";
        }

        // Note: names like "accelerometer" and "gyroscope" are experimental and may not be supported.
        // We'll try both and consider 'granted' if any are granted.
        try {
            const candidates = ["accelerometer", "gyroscope", "motion"];
            for (const name of candidates) {
                try {
                    // types are experimental - cast to any
                    // Some browsers will throw for unknown names; others return a PermissionStatus
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const status = await nav.permissions.query({ name });
                    if (status && status.state === "granted") {
                        return "granted";
                    }
                    if (status && status.state === "prompt") {
                        return "prompt";
                    }
                    // continue to check other sensors
                } catch (err) {
                    // ignore and try next
                }
            }
        } catch (err) {
            // ignore
        }
        return "not-supported";
    }

    // Try the Generic Sensor API (Accelerometer) to detect permission status.
    async function probeGenericSensor(): Promise<PermissionResult> {
        if (!supportsGenericSensor()) return "not-supported";
        try {
            const Accel: any = (window as any).Accelerometer;
            const sensor = new Accel({ frequency: 60 });
            return await new Promise<PermissionResult>((resolve) => {
                const onReading = () => {
                    sensor.stop?.();
                    sensor.removeEventListener("reading", onReading);
                    sensor.removeEventListener("error", onError as any);
                    resolve("granted");
                };
                const onError = (ev: any) => {
                    sensor.removeEventListener("reading", onReading);
                    sensor.removeEventListener("error", onError as any);
                    // NotAllowedError -> permission denied; SecurityError -> not allowed in insecure contexts
                    if (ev && ev.error && ev.error.name === "NotAllowedError") {
                        resolve("denied");
                    } else {
                        resolve("not-supported");
                    }
                };
                sensor.addEventListener("reading", onReading);
                sensor.addEventListener("error", onError as any);
                try {
                    sensor.start();
                } catch (err) {
                    // start() might throw if not allowed or unsupported
                    resolve("denied");
                }
                // Timeout fallback
                setTimeout(() => {
                    try {
                        sensor.stop?.();
                    } catch (e) {}
                    resolve("denied");
                }, 500);
            });
        } catch (err) {
            return "not-supported";
        }
    }

    // Top-level check that tries several strategies to determine whether motion is available.
    async function detectMotionAvailability(): Promise<PermissionResult> {
        // 1) If iOS requestPermission exists, we can't call it on mount (must be user gesture).
        //    But we can consider that permission flow is required (return "prompt").
        if (hasIOSRequestPermission()) {
            return "prompt";
        }

        // 2) Try Permissions API
        const p = await checkPermissionsAPI();
        if (p === "granted") return "granted";
        if (p === "prompt") return "prompt";

        // 3) Try Generic Sensor API probe
        const g = await probeGenericSensor();
        if (g === "granted") return "granted";
        if (g === "denied") return "denied";

        // 4) Fallback to listening for devicemotion events (works in many Android browsers)
        const probe = await probeDeviceMotionEvent(400);
        if (probe === "granted") return "granted";

        // If none worked, report not-supported/denied
        return "denied";
    }

    // Handler called when user clicks "Use Motion Controls"
    const confirmMotion = async () => {
        // iOS specific API - must be called from user gesture
        if (hasIOSRequestPermission()) {
            try {
                const result = await (
                    DeviceMotionEvent as any
                ).requestPermission();
                if (result === "granted") {
                    confirm();
                } else {
                    message =
                        "Permission denied. Please enable Motion & Orientation access in Settings.";
                }
                showButton = false;
                return;
            } catch (err) {
                // requestPermission might throw - treat as denied
                message = "Could not request motion permission on this device.";
                return;
            }
        }

        // Try Generic Sensor API request via starting a sensor (also must be user gesture in some contexts)
        if (supportsGenericSensor()) {
            try {
                const Accel: any = (window as any).Accelerometer;
                const sensor = new Accel({ frequency: 60 });
                const onReading = () => {
                    sensor.stop?.();
                    sensor.removeEventListener("reading", onReading);
                    confirm();
                };
                const onError = (ev: any) => {
                    sensor.stop?.();
                    sensor.removeEventListener("reading", onReading);
                    message =
                        "Access to motion sensors denied or unavailable. Please enable motion sensors in your browser or device settings.";
                };
                sensor.addEventListener("reading", onReading);
                sensor.addEventListener("error", onError as any);
                sensor.start();
                showButton = false;
                return;
            } catch (err) {
                // fallthrough to alternative probe
            }
        }

        // As a final attempt, set up a temporary devicemotion listener and ask user to move device.
        try {
            const granted = await probeDeviceMotionEvent(2000);
            if (granted === "granted") {
                confirm();
            } else {
                message =
                    "Motion events not available. Try enabling motion access in your browser settings or use a different browser (Chrome/Firefox).";
            }
        } catch (err) {
            message = "Unable to obtain motion access on this device.";
        } finally {
            showButton = false;
        }
    };

    // On mount, auto-detect and act where possible.
    onMount(async () => {
        checking = true;
        message = null;

        const status = await detectMotionAvailability();

        checking = false;
        if (status === "granted") {
            // We have motion events available without interacting
            confirm();
            return;
        }

        if (status === "prompt") {
            // iOS or Permissions API indicates we need a user gesture to prompt
            showButton = true;
            message =
                "Motion controls require permission. Tap the button to allow access.";
            return;
        }

        if (status === "denied") {
            // Try to offer the user a button that will attempt interactive permission flow
            showButton = true;
            message =
                "Motion controls appear blocked. Tap to attempt to enable them, or check your browser/device settings.";
            return;
        }

        // not-supported
        showButton = false;
        message = "Motion controls are not supported on this device/browser.";
    });
</script>

<div
    class="container h-full mx-auto flex flex-col justify-center items-center p-4"
>
    {#if checking}
        <div class="meta">Checking motion support…</div>
    {:else}
        {#if message}
            <div class="meta">{message}</div>
        {/if}
        {#if showButton}
            <div class="flex gap-3">
                <button class="btn preset-filled" on:click={confirmMotion}>
                    Use Motion Controls
                </button>
                <button
                    class="btn preset-outline"
                    on:click={() => {
                        // allow retry of detection flow
                        checking = true;
                        message = null;
                        showButton = false;
                        // re-run detect, but leave it to onMount logic by calling it inline:
                        (async () => {
                            const status = await detectMotionAvailability();
                            checking = false;
                            if (status === "granted") {
                                confirm();
                                return;
                            }
                            showButton = true;
                            if (status === "prompt") {
                                message =
                                    "Tap the button to allow motion access.";
                            } else if (status === "denied") {
                                message =
                                    "Motion access still blocked. Check your browser permissions or try a different browser.";
                            } else {
                                message =
                                    "Motion not supported on this device/browser.";
                            }
                        })();
                    }}
                >
                    Retry
                </button>
            </div>
        {/if}
    {/if}
</div>

<style>
    .container {
        height: 100%;
    }
    .meta {
        margin-bottom: 1rem;
        color: var(--muted, #666);
        text-align: center;
    }
</style>
