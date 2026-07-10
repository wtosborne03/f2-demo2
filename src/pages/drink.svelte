<script lang="ts">
  import { onMount } from "svelte";
  import Drink from "$lib/components/drink.svelte";
  import AdminConfirm from "$lib/components/admin_confirm.svelte";

  const m_data = {
    prompt: "Drink",
  };

  // Generate bubbles that travel all the way up the viewport cleanly
  const bubbles = Array.from({ length: 22 }, (_, i) => {
    const size = Math.random() * 8 + 4;
    return {
      id: i,
      left: Math.random() * 100,
      size,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2, // 2s to 5s
      opacity: Math.random() * 0.3 + 0.2,
      sway: Math.random() * 40 - 20,
    };
  });

  // Dynamic foam cluster array for an exaggerated, ultra-bubbly texture
  const foamClusters = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: i * 9 - 5, // Even overlap spacing across the top
    width: Math.random() * 15 + 15, // 15% to 30% width
    height: Math.random() * 30 + 45, // 45px to 75px height
    seed: Math.random() * 2 - 1, // Determines left/right sway direction under momentum
    delay: Math.random() * 0.5,
  }));

  // Motion control physics states
  let tiltX = 0;
  let targetTiltX = 0;
  let slosh = 0;

  onMount(() => {
    let lastTiltX = 0;
    let frameId: number;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null) {
        // Comfortably dampened motion mapping
        targetTiltX = event.gamma * 0.6;
      }
    };

    const updatePhysics = () => {
      // Smooth interpolation for frame updates
      tiltX += (targetTiltX - tiltX) * 0.15;

      const velocity = tiltX - lastTiltX;
      // Fluid physics momentum calculation
      slosh = (slosh + velocity * 1.6) * 0.82;

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
  style="--tilt-x: {tiltX}deg; --slosh: {slosh}px; --slosh-abs: {Math.abs(
    slosh,
  )}px;"
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
        <div
          class="foam-wave-accent"
          style="transform: skewX(calc(var(--slosh) * -0.2deg)) translateY(calc(var(--slosh) * -0.1px));"
        ></div>

        <div class="foam-bumpy-container">
          {#each foamClusters as fc (fc.id)}
            <div
              class="foam-bump"
              style="
                left: {fc.left}%; 
                width: {fc.width}%; 
                height: {fc.height}px; 
                animation-delay: -{fc.delay}s;
                transform: translate3d(calc(var(--slosh) * {fc.seed *
                0.6}px), calc(var(--slosh-abs) * {Math.abs(fc.seed) *
                -0.2}px), 0);
              "
            ></div>
          {/each}
        </div>

        <div
          class="foam-surface-bubble"
          style="left: 12%; top: -15px; width: 14px; height: 14px; transform: translateX(calc(var(--slosh) * 0.4px));"
        ></div>
        <div
          class="foam-surface-bubble"
          style="left: 38%; top: -22px; width: 18px; height: 18px; transform: translateX(calc(var(--slosh) * -0.3px));"
        ></div>
        <div
          class="foam-surface-bubble"
          style="left: 65%; top: -12px; width: 12px; height: 12px; transform: translateX(calc(var(--slosh) * 0.5px));"
        ></div>
        <div
          class="foam-surface-bubble"
          style="left: 82%; top: -18px; width: 16px; height: 16px; transform: translateX(calc(var(--slosh) * -0.2px));"
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

  /* Safe, centralized rotation space using scale transforms instead of shifting margins */
  .beer-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -10;
    overflow: hidden;
    pointer-events: none;

    /* Scale handles overscan safely; pivot matches the 85% liquid line */
    transform: scale(1.5) rotate(calc(var(--tilt-x, 0deg) * -1));
    will-change: transform;
    transform-origin: center 15%;
  }

  /* Liquid fills from bottom to top safely */
  .beer-liquid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to top,
      #5a2400 0%,
      #8a4200 25%,
      #b86f00 55%,
      #cca100 82%,
      #ffd643 100-px
    );
    transform: translateY(100%);
    animation: fill-up-beer 3s cubic-bezier(0.1, 0.85, 0.25, 1) forwards;
    will-change: transform;
  }

  /* Liquid fill level: 15% from top means 85% full container */
  @keyframes fill-up-beer {
    0% {
      transform: translateY(100%);
    }
    100% {
      transform: translateY(15%);
    }
  }

  .bubbles-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

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

  /* Bubbles transit all the way out of the 100% viewport top boundary */
  @keyframes bubble-rise {
    0% {
      transform: translate3d(0, 0, 0) scale(0.5);
      opacity: 0;
    }
    15% {
      opacity: var(--bubble-opacity, 0.4);
    }
    85% {
      opacity: var(--bubble-opacity, 0.4);
    }
    100% {
      transform: translate3d(var(--bubble-sway, 15px), -105vh, 0) scale(1.2);
      opacity: 0;
    }
  }

  /* Enhanced High-Density Foam Head */
  .beer-foam {
    position: absolute;
    top: -20px;
    left: -20%;
    right: -20%;
    height: 50px;
    background: #fdfcf7;
    border-top: 2px solid rgba(255, 255, 255, 0.95);
    box-shadow:
      0 -8px 25px rgba(255, 255, 255, 0.95),
      inset 0 -10px 15px rgba(212, 106, 0, 0.12);
    z-index: 5;

    /* Primary physics sloshing translation loop */
    transform: translate3d(0, calc(var(--slosh) * 0.45px), 0)
      rotate(calc(var(--slosh) * 0.12deg));
    will-change: transform;
    transition: transform 0.05s ease-out;
  }

  /* Shading layer that separates during movement to create depth */
  .foam-wave-accent {
    position: absolute;
    inset: 0;
    top: -5px;
    background: rgba(255, 214, 67, 0.4);
    filter: blur(4px);
    z-index: -2;
    border-radius: 40%;
  }

  .foam-bumpy-container {
    position: absolute;
    top: -40px;
    left: 0;
    right: 0;
    height: 50px;
    z-index: -1;
  }

  /* Foam cluster balls shifting out of phase with momentum */
  .foam-bump {
    position: absolute;
    background: #fdfcf7;
    border-radius: 50%;
    box-shadow:
      0 -4px 10px rgba(255, 255, 255, 0.9),
      inset -3px -3px 8px rgba(0, 0, 0, 0.03);
    animation: foam-idle-wobble 4s ease-in-out infinite alternate;
    will-change: transform;
    transition: transform 0.1s cubic-bezier(0.1, 0.8, 0.3, 1);
  }

  @keyframes foam-idle-wobble {
    0% {
      margin-top: 0px;
    }
    100% {
      margin-top: -6px;
    }
  }

  .foam-surface-bubble {
    position: absolute;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.95);
    border-radius: 50%;
    box-shadow: inset -1px -1px 3px rgba(0, 0, 0, 0.05);
    z-index: 6;
    will-change: transform;
    transition: transform 0.08s ease-out;
  }
</style>
