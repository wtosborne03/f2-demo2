<script lang="ts">
  import { onMount } from "svelte";
  import Drink from "$lib/components/drink.svelte";
  import AdminConfirm from "$lib/components/admin_confirm.svelte";

  const m_data = {
    prompt: "Drink",
  };

  // Keep bubble count optimized but extend their rise distance
  const bubbles = Array.from({ length: 18 }, (_, i) => {
    const size = Math.random() * 8 + 4;
    return {
      id: i,
      left: Math.random() * 100,
      size,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.3 + 0.2,
      sway: Math.random() * 30 - 15,
    };
  });

  // Motion control states
  let tiltX = 0;
  let targetTiltX = 0;
  let slosh = 0;
  let waveOffset = 0;

  onMount(() => {
    let lastTiltX = 0;
    let frameId: number;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null) {
        // Comfortably dampened tilt factor
        targetTiltX = event.gamma * 0.55;
      }
    };

    const updatePhysics = () => {
      // Smooth out the device jerky movements
      tiltX += (targetTiltX - tiltX) * 0.12;

      const velocity = tiltX - lastTiltX;

      // Spring-mass physics simulation for the liquid inertia
      slosh = (slosh + velocity * 1.5) * 0.82;

      // Continuous wave ripple phase shift based on movement
      waveOffset += Math.abs(slosh) * 0.05 + 0.02;

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
  style="--tilt-x: {tiltX}deg; --slosh: {slosh}px; --wave-shift: {Math.sin(
    waveOffset,
  ) *
    slosh *
    0.4}px;"
>
  <div class="beer-bg" aria-hidden="true">
    <div class="beer-liquid">
      <div
        class="wave-container"
        style="transform: translateY(calc(-100% + 2px)) scaleY({1 +
          Math.abs(slosh) * 0.005});"
      >
        <svg viewBox="0 0 120 28" class="wave-svg" preserveAspectRatio="none">
          <path
            d="M0 15 Q 30 {15 + slosh * 0.5}, 60 15 T 120 15 L 120 28 L 0 28 Z"
            fill="#ffe16f"
            opacity="0.5"
            style="transform: translateX({Math.sin(waveOffset) * 10}px);"
          />
          <path
            d="M0 15 Q 30 {15 - slosh * 0.6}, 60 15 T 120 15 L 120 28 L 0 28 Z"
            fill="#fdfcf7"
          />
        </svg>
      </div>

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
            style="left: -5%; width: 25%; height: 55px; transform: translateY(var(--wave-shift));"
          ></div>
          <div
            class="foam-bump"
            style="left: 15%; width: 35%; height: 65px; transform: translateY(calc(var(--wave-shift) * -0.8));"
          ></div>
          <div
            class="foam-bump"
            style="left: 40%; width: 28%; height: 50px; transform: translateY(calc(var(--wave-shift) * 1.2));"
          ></div>
          <div
            class="foam-bump"
            style="left: 62%; width: 32%; height: 60px; transform: translateY(calc(var(--wave-shift) * -0.5));"
          ></div>
          <div
            class="foam-bump"
            style="left: 85%; width: 25%; height: 55px; transform: translateY(var(--wave-shift));"
          ></div>
        </div>

        <div
          class="foam-surface-bubble"
          style="left: 15%; top: -10px; width: 12px; height: 12px;"
        ></div>
        <div
          class="foam-surface-bubble"
          style="left: 45%; top: -14px; width: 16px; height: 16px;"
        ></div>
        <div
          class="foam-surface-bubble"
          style="left: 75%; top: -10px; width: 13px; height: 13px;"
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
    overflow: hidden;
  }

  :global(#main-background:has(.drink-page)) {
    position: relative;
    overflow: hidden;
  }

  /* Beer background container centering layout adjustments */
  .beer-bg {
    position: absolute;
    top: -60%;
    left: -60%;
    right: -60%;
    bottom: -60%;
    z-index: -10;
    overflow: hidden;
    pointer-events: none;

    transform: rotate(calc(var(--tilt-x, 0deg) * -1));
    will-change: transform;
    transform-origin: center 48%;
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
      #daa400 90%,
      #ffe16f 100%
    );
    transform: translateY(100%);
    animation: fill-up-beer 3.5s cubic-bezier(0.1, 0.8, 0.25, 1) forwards;
    will-change: transform;
  }

  /* Fix: Correct liquid level position relative to massive backdrop */
  @keyframes fill-up-beer {
    0% {
      transform: translateY(100%);
    }
    100% {
      transform: translateY(
        46%
      ); /* Higher liquid point keeps foam near top viewport line */
    }
  }

  /* SVG Wave Wrapper */
  .wave-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 40px;
    will-change: transform;
  }

  .wave-svg {
    width: 100%;
    height: 100%;
  }

  .bubbles-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .bubble {
    position: absolute;
    bottom: -20px;
    background: rgba(255, 255, 255, 0.28);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    animation: bubble-rise infinite linear;
    pointer-events: none;
    will-change: transform, opacity;
  }

  /* Fix: Bubbles travel all the way up past the elevated foam boundary */
  @keyframes bubble-rise {
    0% {
      transform: translate3d(0, 0, 0) scale(0.6);
      opacity: 0;
    }
    10% {
      opacity: var(--bubble-opacity, 0.4);
    }
    90% {
      opacity: var(--bubble-opacity, 0.4);
    }
    100% {
      transform: translate3d(var(--bubble-sway, 10px), -160vh, 0) scale(1.1);
      opacity: 0;
    }
  }

  /* Enhanced Fluffy Foam Head placed flawlessly on the wave crest */
  .beer-foam {
    position: absolute;
    top: -15px;
    left: -10%;
    right: -10%;
    height: 65px;
    background: #fdfcf7;
    border-top: 1px solid rgba(255, 255, 255, 0.95);
    box-shadow:
      0 -6px 20px rgba(255, 255, 255, 0.95),
      inset 0 -8px 12px rgba(212, 106, 0, 0.08);
    z-index: 5;

    /* Inertial tilt distortion combined with independent ripple */
    transform: translate3d(0, calc(var(--slosh) * 0.4), 0)
      skewX(calc(var(--slosh) * 0.15deg));
    will-change: transform;
  }

  .foam-bumpy-container {
    position: absolute;
    top: -35px;
    left: 0;
    right: 0;
    height: 65px;
    z-index: -1;
  }

  .foam-bump {
    position: absolute;
    background: #fdfcf7;
    border-radius: 50%;
    box-shadow: 0 -3px 8px rgba(255, 255, 255, 0.85);
    will-change: transform;
    transition: transform 0.1s ease-out;
  }

  .foam-surface-bubble {
    position: absolute;
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.95);
    border-radius: 50%;
    z-index: 6;
  }
</style>
