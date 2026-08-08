<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { browser } from "$app/environment";
  import { playerEmote, isBackgroundTap } from "$lib/avatar/player_emote";

  interface Ripple {
    id: number;
    x: number;
    y: number;
    size: number;
  }

  let ripples = $state<Ripple[]>([]);
  let nextRippleId = 0;

  function handlePointerDown(e: PointerEvent) {
    // Only process primary pointer (main touch/mouse click)
    if (!e.isPrimary) return;

    // Ensure tap target is background only (not button, input, slider, modal, link, etc.)
    if (!isBackgroundTap(e.target)) return;

    // Trigger emote WS payload + Web Vibration API haptic feedback
    playerEmote();

    // Spawn Material UI circular ripple at tap coordinate
    const x = e.clientX;
    const y = e.clientY;

    // Dynamic size calculation for full coverage from tap point
    const maxDim = Math.max(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );
    const size = Math.min(Math.max(240, maxDim * 0.8), 380);

    const id = nextRippleId++;
    // Keep maximum 6 active ripples simultaneously to stay lightweight & performant
    ripples = [...ripples.slice(-5), { id, x, y, size }];

    setTimeout(() => {
      ripples = ripples.filter((r) => r.id !== id);
    }, 650);
  }

  onMount(() => {
    if (!browser) return;
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
  });

  onDestroy(() => {
    if (!browser) return;
    window.removeEventListener("pointerdown", handlePointerDown);
  });
</script>

<!-- Minimal Background Circular Ripple Overlay (Rendered behind UI elements at z-0) -->
<div class="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
  {#each ripples as ripple (ripple.id)}
    <div
      class="m3-ripple-origin"
      style="left: {ripple.x}px; top: {ripple.y}px; width: {ripple.size}px; height: {ripple.size}px;"
    >
      <div class="m3-ripple-minimal"></div>
    </div>
  {/each}
</div>

<style>
  .m3-ripple-origin {
    position: absolute;
    pointer-events: none;
    transform: translate(-50%, -50%);
  }

  /* Minimal translucent circle that expands and fades out with no colors/gradients */
  .m3-ripple-minimal {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.16);
    will-change: transform, opacity;
    animation: m3-ripple-minimal-anim 550ms cubic-bezier(0, 0, 0.2, 1) forwards;
  }

  @keyframes m3-ripple-minimal-anim {
    0% {
      transform: scale(0);
      opacity: 0.35;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }
</style>

