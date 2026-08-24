<script lang="ts">
  import { sideBarOpen } from "../stores/sidebar";
  import { authClient } from "../stores/authStore";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import Icon from "@iconify/svelte";
  import CatchphraseRecorder from "$lib/components/CatchphraseRecorder.svelte";

  const session = authClient.useSession();

  let padElement: HTMLDivElement | null = $state(null);
  let ballX = $state(0);
  let ballY = $state(0);
  let isDragging = $state(false);

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let lastDirectionSent: string | null = null;
  let repeatTimer: any = null;
  let hasTriggeredInDrag = false;

  const MAX_DRAG_RADIUS = 68;
  const TRIGGER_THRESHOLD = 30;

  function vibrate(ms = 22) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  }

  function sendNav(
    action: "up" | "down" | "left" | "right" | "select" | "back",
  ) {
    vibrate(22);
    gameClient.sendInput({
      type: "lobby_nav",
      action: action,
    });
  }

  function handlePointerDown(e: PointerEvent) {
    if (!padElement) return;
    padElement.setPointerCapture(e.pointerId);
    isDragging = true;
    hasTriggeredInDrag = false;
    lastDirectionSent = null;
    startX = e.clientX;
    startY = e.clientY;
    startTime = Date.now();
    ballX = 0;
    ballY = 0;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const distance = Math.hypot(dx, dy);

    // Clamp ball displacement to max radius
    if (distance > MAX_DRAG_RADIUS) {
      const angle = Math.atan2(dy, dx);
      ballX = Math.cos(angle) * MAX_DRAG_RADIUS;
      ballY = Math.sin(angle) * MAX_DRAG_RADIUS;
    } else {
      ballX = dx;
      ballY = dy;
    }

    // Determine current direction based on displacement
    let currentDir: "up" | "down" | "left" | "right" | null = null;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > TRIGGER_THRESHOLD) currentDir = "right";
      else if (dx < -TRIGGER_THRESHOLD) currentDir = "left";
    } else {
      if (dy > TRIGGER_THRESHOLD) currentDir = "down";
      else if (dy < -TRIGGER_THRESHOLD) currentDir = "up";
    }

    if (currentDir && currentDir !== lastDirectionSent) {
      lastDirectionSent = currentDir;
      hasTriggeredInDrag = true;
      sendNav(currentDir);

      // Repeat if held in position
      clearInterval(repeatTimer);
      repeatTimer = setInterval(() => {
        if (isDragging && lastDirectionSent === currentDir) {
          sendNav(currentDir);
        }
      }, 260);
    } else if (!currentDir) {
      lastDirectionSent = null;
      clearInterval(repeatTimer);
    }
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging) return;
    clearInterval(repeatTimer);
    isDragging = false;

    const duration = Date.now() - startTime;
    const distance = Math.hypot(ballX, ballY);

    // If tap without dragging, trigger select
    if (!hasTriggeredInDrag && distance < 12 && duration < 320) {
      sendNav("select");
    }

    // Spring back to center
    ballX = 0;
    ballY = 0;
    lastDirectionSent = null;
  }

  function handlePointerCancel() {
    clearInterval(repeatTimer);
    isDragging = false;
    ballX = 0;
    ballY = 0;
    lastDirectionSent = null;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="flex flex-col w-full max-w-sm mx-auto px-4 py-4 sm:py-6 pb-28 my-auto max-h-full gap-4 items-center select-none"
>
  <!-- Catchphrase Recorder on top -->
  <div class="w-full">
    <CatchphraseRecorder />
  </div>

  <!-- Google TV / Material You Remote Container -->
  <div
    class="w-full flex flex-col items-center gap-4 rounded-[2.25rem] p-4 sm:p-5"
  >
    <!-- Room Code Header / Status -->
    <div class="flex items-center justify-between w-full px-1">
      {#if $gameState.roomCode}
        <div
          class="px-2.5 py-0.5 rounded-full bg-white/10 text-primary font-mono font-black text-xs tracking-widest border border-white/10"
        >
          {$gameState.roomCode}
        </div>
      {/if}
    </div>

    <!-- Large Touchpad D-Pad Surface with Draggable Ball + Optional Arrow Buttons -->
    <div
      bind:this={padElement}
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerCancel}
      class="relative w-full aspect-square max-w-[18.5rem] bg-[#282a2d] border border-white/10 rounded-[2.25rem] flex items-center justify-center overflow-hidden shadow-inner cursor-grab active:cursor-grabbing touch-none select-none"
      style="touch-action: none;"
    >
      <!-- Optional Clickable Top Arrow -->
      <button
        type="button"
        class="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-10 flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all cursor-pointer z-10"
        onclick={(e) => {
          e.stopPropagation();
          sendNav("up");
        }}
        aria-label="Up"
      >
        <Icon icon="mdi:chevron-up" class="text-2xl sm:text-3xl" />
      </button>

      <!-- Optional Clickable Bottom Arrow -->
      <button
        type="button"
        class="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-10 flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all cursor-pointer z-10"
        onclick={(e) => {
          e.stopPropagation();
          sendNav("down");
        }}
        aria-label="Down"
      >
        <Icon icon="mdi:chevron-down" class="text-2xl sm:text-3xl" />
      </button>

      <!-- Optional Clickable Left Arrow -->
      <button
        type="button"
        class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-16 flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all cursor-pointer z-10"
        onclick={(e) => {
          e.stopPropagation();
          sendNav("left");
        }}
        aria-label="Left"
      >
        <Icon icon="mdi:chevron-left" class="text-2xl sm:text-3xl" />
      </button>

      <!-- Optional Clickable Right Arrow -->
      <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-16 flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-all cursor-pointer z-10"
        onclick={(e) => {
          e.stopPropagation();
          sendNav("right");
        }}
        aria-label="Right"
      >
        <Icon icon="mdi:chevron-right" class="text-2xl sm:text-3xl" />
      </button>
      <!-- Center Draggable Ball (Thumbstick Knob) -->
      <div
        class="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#e3e3e8] flex items-center justify-center pointer-events-none z-20 transition-transform {isDragging
          ? 'duration-0'
          : 'duration-200 ease-out'}"
        style="transform: translate({ballX}px, {ballY}px) scale({isDragging
          ? 1.06
          : 1});"
      >
        <div class="w-4 h-4 rounded-full bg-[#b4b4b8] opacity-60" />
      </div>
    </div>

    <!-- Material Pill Buttons: Back and Select -->
    <div class="grid grid-cols-1 gap-3 w-full max-w-[18.5rem]">
      <!-- Back Button -->
      <button
        type="button"
        class="h-14 sm:h-16 rounded-[1.5rem] bg-[#282a2d] hover:bg-[#34373c] active:bg-[#3f4349] border border-white/10 text-white flex items-center justify-center text-xl sm:text-2xl shadow-md active:scale-95 transition-all cursor-pointer"
        onclick={() => sendNav("back")}
        aria-label="Back"
        title="Back"
      >
        <Icon icon="mdi:arrow-left" />
      </button>
    </div>

    {#if !$session.data?.user}
      <div class="text-center text-xs opacity-60 -mt-2">
        (
        <span
          class="text-primary hover:underline cursor-pointer font-semibold"
          onclick={() => sideBarOpen.set(true)}
        >
          Sign In
        </span>
        to customize avatar.)
      </div>
    {/if}
  </div>
</div>
