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

<!-- Material UI Background Circular Ripple Overlay -->
<div class="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden="true">
  {#each ripples as ripple (ripple.id)}
    <div
      class="m3-ripple-origin"
      style="left: {ripple.x}px; top: {ripple.y}px; width: {ripple.size}px; height: {ripple.size}px;"
    >
      <div class="m3-ripple-wave"></div>
      <div class="m3-ripple-accent-ring"></div>
    </div>
  {/each}
</div>

<style>
  .m3-ripple-origin {
    position: absolute;
    pointer-events: none;
    transform: translate(-50%, -50%);
  }

  /* Core expanding gradient wave matching CouchCup palette */
  .m3-ripple-wave {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      rgba(242, 185, 15, 0.4) 0%,
      rgba(191, 56, 44, 0.28) 40%,
      rgba(168, 85, 247, 0.12) 70%,
      transparent 100%
    );
    box-shadow: 0 0 30px rgba(242, 185, 15, 0.3);
    will-change: transform, opacity;
    animation: m3-ripple-expand 600ms cubic-bezier(0, 0, 0.2, 1) forwards;
  }

  /* Sharp accent ring for distinct Material ripple definition */
  .m3-ripple-accent-ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.55);
    will-change: transform, opacity;
    animation: m3-ring-expand 520ms cubic-bezier(0, 0, 0.2, 1) forwards;
  }

  @keyframes m3-ripple-expand {
    0% {
      transform: scale(0.04);
      opacity: 0.9;
    }
    40% {
      opacity: 0.55;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }

  @keyframes m3-ring-expand {
    0% {
      transform: scale(0.02);
      opacity: 0.85;
      border-width: 2.5px;
    }
    100% {
      transform: scale(0.92);
      opacity: 0;
      border-width: 1px;
    }
  }
</style>
