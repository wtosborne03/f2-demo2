<script lang="ts">
  import { onMount } from "svelte";
  import Drink from "$lib/components/drink.svelte";
  import AdminConfirm from "$lib/components/admin_confirm.svelte";

  const m_data = {
    prompt: "Drink",
  };

  // Optimize bubble count from 35 to 18 for rendering efficiency
  const bubbles = Array.from({ length: 18 }, (_, i) => {
    const size = Math.random() * 8 + 4; // size from 4px to 12px
    return {
      id: i,
      left: Math.random() * 100,
      size,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2, // 2s to 5s
      opacity: Math.random() * 0.3 + 0.2,
      sway: Math.random() * 20 - 10, // -10px to 10px
    };
  });

  // Motion control states
  let tiltX = 0; // Left/Right tilt (Gamma)
  let targetTiltX = 0;
  let slosh = 0; // Calculated velocity for the sloshing effect

  onMount(() => {
    let lastTiltX = 0;
    let frameId: number;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null) {
        // Toning down the tilt effect by multiplying by 0.65 (limits extreme rotation angles)
        targetTiltX = event.gamma * 0.65;
      }
    };

    // Smoothly interpolate angles to prevent stuttering and calculate slosh velocity
    const updatePhysics = () => {
      // Linear interpolation (lerp) for smooth movement
      tiltX += (targetTiltX - tiltX) * 0.15;

      // Slosh represents the speed of movement. Change in tilt = acceleration.
      const velocity = tiltX - lastTiltX;

      // decay the slosh effect gently over time, multiplying to control intensity
      slosh = (slosh + velocity * 0.8) * 0.85;

      lastTiltX = tiltX;
      frameId = requestAnimationFrame(updatePhysics);
    };

    const DeviceEvent = window.DeviceOrientationEvent as any;
    if (DeviceEvent && typeof DeviceEvent.requestPermission === "function") {
      navigator.permissions
        ?.query({ name: "accelerometer" as any })
        .then((result) => {
          if (result.state === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
            frameId = requestAnimationFrame(updatePhysics);
          }
        })
        .catch(() => {});
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
      frameId = requestAnimationFrame(updatePhysics);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
      cancelAnimationFrame(frameId);
    };
  });
</script>

<div
  class="drink-page w-full flex flex-col justify-center items-center relative"
  style="--tilt-x: {tiltX}deg; --slosh: {slosh}px; --slosh-skew: {slosh *
    0.2}deg;"
>
  <div class="beer-bg" aria-hidden="true">
    <div class="beer-liquid">
      <div class="bubbles-container">
        {#each bubbles as b (b.id)}
          <div
            class="bubble"
            style="left: {b.left}%; width: {b.size}px; height: {b.size}px; animation-delay: -{b.delay}s; animation-duration: {b.duration}s; --bubble-opacity: {b.opacity}; --bubble-sway: {b.sway}px;"
          ></div>
        {/each}
      </div>

      <div class="beer-foam">
        <div class="foam-bumpy-container">
          <div
            class="foam-bump"
            style="left: -5%; width: 25%; height: 45px; animation-delay: 0.1s;"
          ></div>
          <div
            class="foam-bump"
            style="left: 12%; width: 32%; height: 55px; animation-delay: 0.4s;"
          ></div>
          <div
            class="foam-bump"
            style="left: 36%; width: 24%; height: 42px; animation-delay: 0.2s;"
          ></div>
          <div
            class="foam-bump"
            style="left: 50%; width: 28%; height: 50px; animation-delay: 0.7s;"
          ></div>
          <div
            class="foam-bump"
            style="left: 70%; width: 25%; height: 46px; animation-delay: 0.3s;"
          ></div>
          <div
            class="foam-bump"
            style="left: 85%; width: 28%; height: 52px; animation-delay: 0.5s;"
          ></div>
        </div>

        <div
          class="foam-surface-bubble"
          style="left: 15%; top: -10px; width: 12px; height: 12px; animation-delay: 0.2s;"
        ></div>
        <div
          class="foam-surface-bubble"
          style="left: 35%; top: -14px; width: 16px; height: 16px; animation-delay: 0.8s;"
        ></div>
        <div
          class="foam-surface-bubble"
          style="left: 55%; top: -8px; width: 10px; height: 10px; animation-delay: 0.5s;"
        ></div>
        <div
          class="foam-surface-bubble"
          style="left: 72%; top: -12px; width: 14px; height: 14px; animation-delay: 1.1s;"
        ></div>
      </div>
    </div>
  </div>

  <Drink prompt={m_data.prompt} />

  <AdminConfirm
    class="absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))] mx-4"
  />
</div>

<style>
  .drink-page {
    min-height: 100%;
    width: 100%;
    z-index: 1;
    overflow: hidden; /* Fixes unexpected outer scrollbars */
  }

  /* Target the main background wrapper for this page specifically */
  :global(#main-background:has(.drink-page)) {
    position: relative;
    overflow: hidden;
  }

  /* Beer background container */
  .beer-bg {
    position: absolute;
    /* Massive coverage padding eliminates edge exposure during turns */
    top: -50%;
    left: -50%;
    right: -50%;
    bottom: -50%;
    z-index: -10;
    overflow: hidden;
    pointer-events: none;

    /* Rotate container opposite to the device tilt */
    transform: rotate(calc(var(--tilt-x, 0deg) * -1));
    will-change: transform;
    transform-origin: center 55%;
  }

  /* Golden-Amber Beer Liquid */
  .beer-liquid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to top,
      #6b3000 0%,
      #944a00 30%,
      #c17700 65%,
      #daa400 92%,
      #ffe16f 100%
    );
    transform: translateY(100%);
    animation: fill-up-beer 4s cubic-bezier(0.15, 0.85, 0.35, 1) forwards;
    will-change: transform;
  }

  /* Rising animation for beer liquid */
  @keyframes fill-up-beer {
    0% {
      transform: translateY(100%);
    }
    100% {
      transform: translateY(
        33%
      ); /* Lowered value to balance huge canvas bleed */
    }
  }

  /* Bubbles Container */
  .bubbles-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  /* Optimized glassy bubble styling */
  .bubble {
    position: absolute;
    bottom: -20px;
    background: rgba(255, 255, 255, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.45);
    border-radius: 50%;
    animation: bubble-rise infinite linear;
    pointer-events: none;
    will-change: transform, opacity;
  }

  /* Bubble rise and pop animation */
  @keyframes bubble-rise {
    0% {
      transform: translate3d(0, -50vh, 0) scale(0.6);
      opacity: 0;
    }
    10% {
      opacity: var(--bubble-opacity, 0.4);
    }
    90% {
      opacity: var(--bubble-opacity, 0.4);
    }
    100% {
      transform: translate3d(var(--bubble-sway, 10px), -190vh, 0) scale(2);
      opacity: 0;
    }
  }

  /* Fluffy Foam Head */
  .beer-foam {
    position: absolute;
    top: -25px;
    left: 0;
    right: 0;
    height: 50px;
    background: #fdfcf7;
    border-top: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow:
      0 -4px 15px rgba(255, 255, 255, 0.9),
      inset 0 -6px 8px rgba(212, 106, 0, 0.1);
    z-index: 5;

    /* Low overhead physics: dynamic translate & skew mimic inertia sloshing */
    transform: translate3d(0, calc(var(--slosh) * 0.3), 0)
      skewX(var(--slosh-skew));
    will-change: transform;
  }

  /* Foam bump shapes to create fluffy cloud look */
  .foam-bumpy-container {
    position: absolute;
    top: -25px;
    left: 0;
    right: 0;
    height: 50px;
    z-index: -1;
  }

  .foam-bump {
    position: absolute;
    background: #fdfcf7;
    border-radius: 50%;
    box-shadow: 0 -2px 6px rgba(255, 255, 255, 0.8);
    animation: foam-wiggle 3s ease-in-out infinite alternate;
    will-change: transform;
  }

  @keyframes foam-wiggle {
    0% {
      transform: translateY(0) scale(1);
    }
    100% {
      transform: translateY(-4px) scale(1.04);
    }
  }

  /* Static/Drifting bubbles on foam surface */
  .foam-surface-bubble {
    position: absolute;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    z-index: 6;
    animation: foam-bubble-drift 5s ease-in-out infinite alternate;
    will-change: transform;
  }

  @keyframes foam-bubble-drift {
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(4px, -3px, 0);
    }
  }
</style>
