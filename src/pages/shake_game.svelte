<script lang="ts">
    import { sendMessage } from "$lib/webSocketService";
    import { onDestroy, onMount } from "svelte";
    import { draggable } from "@neodrag/svelte";
    import type { DragEventData } from "@neodrag/svelte";
    import type { PlayerState } from "../types/player_state";
    import { player_state } from "../stores/player_state";
    import { get } from "svelte/store";
    import { gameClient } from "$lib/gameService";

    let pos = 0;

    // Keep a reference to a Generic Sensor instance if created (Android/Chrome)
    let sensor: any = null;
    let usingGenericSensor = false;

    // Probe for motion availability by trying Generic Sensor API first, then falling back
    // to a short devicemotion listener probe. Returns 'granted' | 'not-determined'
    function checkMotionPermission() {
        return new Promise<"granted" | "not-determined">((resolve) => {
            const SensorCtor =
                (window as any).Accelerometer ||
                (window as any).LinearAccelerationSensor ||
                (window as any).Gyroscope;

            if (SensorCtor) {
                try {
                    // Construct a sensor probe; if this throws or errors, we'll fallback to devicemotion
                    sensor = new SensorCtor({ frequency: 60 });

                    const onReading = () => {
                        // We received sensor data -> treat as granted and keep sensor available for real-time use
                        usingGenericSensor = true;
                        // Remove probe listeners (we'll reattach proper handlers later)
                        try {
                            sensor.removeEventListener &&
                                sensor.removeEventListener(
                                    "reading",
                                    onReading,
                                );
                            sensor.removeEventListener &&
                                sensor.removeEventListener("error", onError);
                        } catch (e) {}
                        resolve("granted");
                    };

                    const onError = (_ev: any) => {
                        // Cannot access sensor (denied or unavailable); stop and fall back
                        try {
                            sensor.removeEventListener &&
                                sensor.removeEventListener(
                                    "reading",
                                    onReading,
                                );
                            sensor.removeEventListener &&
                                sensor.removeEventListener("error", onError);
                            sensor.stop && sensor.stop();
                        } catch (e) {}
                        sensor = null;
                        resolve("not-determined");
                    };

                    sensor.addEventListener &&
                        sensor.addEventListener("reading", onReading);
                    sensor.addEventListener &&
                        sensor.addEventListener("error", onError);

                    try {
                        sensor.start();
                    } catch (e) {
                        // start may throw if not allowed; cleanup and fall through to devicemotion
                        try {
                            sensor.removeEventListener &&
                                sensor.removeEventListener(
                                    "reading",
                                    onReading,
                                );
                            sensor.removeEventListener &&
                                sensor.removeEventListener("error", onError);
                            sensor.stop && sensor.stop();
                        } catch (e) {}
                        sensor = null;
                        resolve("not-determined");
                        return;
                    }

                    // Timeout: if no reading within 400ms, treat as not-determined and stop probe
                    setTimeout(() => {
                        if (!usingGenericSensor) {
                            try {
                                sensor.removeEventListener &&
                                    sensor.removeEventListener(
                                        "reading",
                                        onReading,
                                    );
                                sensor.removeEventListener &&
                                    sensor.removeEventListener(
                                        "error",
                                        onError,
                                    );
                                sensor.stop && sensor.stop();
                            } catch (e) {}
                            sensor = null;
                            resolve("not-determined");
                        }
                    }, 400);

                    return; // early return because we handled sensor path
                } catch (err) {
                    // fall through to devicemotion probe
                    sensor = null;
                }
            }

            // Fallback: listen briefly for a devicemotion event to infer permission / availability
            function handleMotionProbe(event: DeviceMotionEvent) {
                if (
                    event.acceleration?.z ||
                    event.accelerationIncludingGravity?.z
                ) {
                    window.removeEventListener(
                        "devicemotion",
                        handleMotionProbe,
                    );
                    resolve("granted");
                } else {
                    // Saw an event but not useful data
                    window.removeEventListener(
                        "devicemotion",
                        handleMotionProbe,
                    );
                    resolve("not-determined");
                }
            }

            window.addEventListener("devicemotion", handleMotionProbe);

            // Set a timeout to handle the case where the event does not fire
            setTimeout(() => {
                window.removeEventListener("devicemotion", handleMotionProbe);
                resolve("not-determined");
            }, 400); // Adjust the timeout as needed
        });
    }

    async function checkMotion() {
        // If either DeviceMotionEvent or Generic Sensor API exists, probe
        if (
            typeof DeviceMotionEvent !== "undefined" ||
            typeof (window as any).Accelerometer !== "undefined" ||
            typeof (window as any).LinearAccelerationSensor !== "undefined" ||
            typeof (window as any).Gyroscope !== "undefined"
        ) {
            const permissionState = await checkMotionPermission();
            if (permissionState === "granted") {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    let motion = false;
    let initialPosition = { x: 0, y: 0 };
    let lastShakingDistance = 0;
    let totalShakingDistance = 0;
    let lastDragTime = 0;
    let lastMotionTime = 0;

    const sendProgress = (progress: number) => {
        gameClient.sendPlayerInput({
            payload: {
                $case: "shakeProgress",
                shakeProgress: {
                    progress: progress,
                    motion: motion,
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
        const velocity = distanceMoved / timeDifference;

        totalShakingDistance += distanceMoved;

        sendProgress(currentPosition.y * 0.05);

        initialPosition = currentPosition; // Update initial position to current position
        lastDragTime = currentTime; // Update last drag time
    }

    // Unified motion handler that accepts either a DeviceMotionEvent or a synthetic object from Generic Sensor
    function handleMotion(event: DeviceMotionEvent | any) {
        // Normalize event to have accelerationIncludingGravity and acceleration fields
        const accInc = event.accelerationIncludingGravity ||
            (event as any).acceleration || { x: 0, y: 0, z: 0 };
        const acc = event.acceleration || accInc || { x: 0, y: 0, z: 0 };

        if (accInc) {
            const distanceMoved = Math.sqrt(
                Math.pow(accInc.x || 0, 2) + Math.pow(accInc.y || 0, 2),
            );
            const currentTime = Date.now();
            const timeDifference = Math.max(1, currentTime - lastMotionTime);
            const velocity = distanceMoved / timeDifference;

            totalShakingDistance += distanceMoved;
            // use acceleration if available, fall back to accelerationIncludingGravity
            const yVal = acc.y ?? accInc.y ?? 0;
            pos -= yVal;
            sendProgress(yVal);

            lastMotionTime = currentTime; // Update last motion time
        }
    }

    // Initialize listeners depending on available APIs. Generic Sensor preferred for Android/Chrome.
    function initMotionListeners() {
        const SensorCtor =
            (window as any).Accelerometer ||
            (window as any).LinearAccelerationSensor ||
            (window as any).Gyroscope;

        if (SensorCtor) {
            try {
                // If we already have a sensor from the probe, re-use it; otherwise create a fresh one.
                if (!sensor) {
                    sensor = new SensorCtor({ frequency: 60 });
                }

                const onReading = () => {
                    // Construct a DeviceMotionEvent-like object from sensor readings
                    // Different sensor types may expose different properties; use x,y,z where available
                    const syntheticEvent = {
                        acceleration: {
                            x: sensor.x ?? sensor.acceleration?.x ?? 0,
                            y: sensor.y ?? sensor.acceleration?.y ?? 0,
                            z: sensor.z ?? sensor.acceleration?.z ?? 0,
                        },
                        accelerationIncludingGravity: {
                            x: sensor.x ?? sensor.acceleration?.x ?? 0,
                            y: sensor.y ?? sensor.acceleration?.y ?? 0,
                            z: sensor.z ?? sensor.acceleration?.z ?? 0,
                        },
                    } as DeviceMotionEvent;

                    handleMotion(syntheticEvent);
                };

                const onError = (_ev: any) => {
                    // If sensor errors, fall back to devicemotion events
                    try {
                        sensor.removeEventListener &&
                            sensor.removeEventListener("reading", onReading);
                        sensor.removeEventListener &&
                            sensor.removeEventListener("error", onError);
                        sensor.stop && sensor.stop();
                    } catch (e) {}
                    sensor = null;
                    window.addEventListener(
                        "devicemotion",
                        handleMotion as any,
                    );
                };

                sensor.addEventListener &&
                    sensor.addEventListener("reading", onReading);
                sensor.addEventListener &&
                    sensor.addEventListener("error", onError);
                sensor.start && sensor.start();

                motion = true;
                usingGenericSensor = true;
                return;
            } catch (err) {
                // Fall through to devicemotion
                try {
                    sensor = null;
                } catch (e) {}
            }
        }

        // Fallback: use devicemotion events
        window.addEventListener("devicemotion", handleMotion as any);
        motion = true;
    }

    onMount(() => {
        checkMotion().then((value) => {
            motion = value;
            if (motion) {
                // Initialize appropriate listeners (Generic Sensor preferred)
                initMotionListeners();
            }
        });
    });

    onDestroy(() => {
        try {
            window.removeEventListener("devicemotion", handleMotion as any);
        } catch (e) {}
        try {
            if (sensor) {
                // We attached sensor 'reading' with a closure, so try to stop it
                try {
                    sensor.removeEventListener &&
                        sensor.removeEventListener(
                            "reading",
                            handleMotion as any,
                        );
                } catch (e) {}
                try {
                    sensor.stop && sensor.stop();
                } catch (e) {}
                sensor = null;
            }
        } catch (e) {}
    });
</script>

<div class="container h-full mx-auto flex flex-col justify-center items-center">
    {#if motion}
        <div class="border-4 p-3" style:border-color={get(player_state).color}>
            Shake your device to play 🫨
        </div>
    {:else}
        Drag the duck around to Shake it
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
    {/if}
</div>
