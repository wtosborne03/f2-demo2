<script lang="ts">
  import { sideBarOpen } from "../stores/sidebar";
  import { authClient } from "../stores/authStore";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import Icon from "@iconify/svelte";
  import CatchphraseRecorder from "$lib/components/CatchphraseRecorder.svelte";
  import { apiClient } from "$lib/backend/axios";

  const session = authClient.useSession();

  let isEditingName = $state(false);
  let editNameInput = $state("");

  function startEditName() {
    editNameInput = $gameState.name || "Host";
    isEditingName = true;
  }

  async function saveName() {
    const trimmed = editNameInput.trim().substring(0, 10);
    if (trimmed) {
      gameClient.renamePlayer(trimmed);
      try {
        const client = await apiClient;
        if (client) {
          await client.putUsersName({}, { name: trimmed });
        }
      } catch (err) {
        console.warn("Failed saving name to account:", err);
      }
    }
    isEditingName = false;
  }

  function cancelEditName() {
    isEditingName = false;
  }

  let padElement: HTMLDivElement | null = $state(null);
  let ballX = $state(0);
  let ballY = $state(0);
  let isDragging = $state(false);
  let activeDir = $state<"up" | "down" | "left" | "right" | null>(null);

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let lastDirectionSent: string | null = null;
  let repeatTimer: any = null;
  let hasTriggeredInDrag = false;

  const MAX_DRAG_RADIUS = 68;
  const TRIGGER_THRESHOLD = 28;

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
    vibrate(25);
    gameClient.sendInput({
      type: "lobby_nav",
      action: action,
    });
  }

  function triggerArrow(dir: "up" | "down" | "left" | "right") {
    activeDir = dir;
    sendNav(dir);
    setTimeout(() => {
      if (!isDragging) activeDir = null;
    }, 180);
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

    activeDir = currentDir;

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
    activeDir = null;

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
    activeDir = null;
    ballX = 0;
    ballY = 0;
    lastDirectionSent = null;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="flex flex-col w-full max-w-lg mx-auto px-4 py-2 my-auto max-h-full gap-3 items-center select-none justify-between"
>
  <!-- Catchphrase Recorder on top -->

  <!-- Bauhaus Constructivist Remote Housing -->
  <div class="w-full flex flex-col items-center gap-3.5">
    <!-- Casting Host / Controller Name Bar -->
    <div
      class="w-full max-w-[17.5rem] bg-white border-3 border-[#121212] shadow-[4px_4px_0px_#121212] p-2 px-3 flex flex-col gap-1.5"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <div
            class="w-6 h-6 bg-[#F0C020] border-2 border-[#121212] flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#121212]"
          >
            <Icon icon="mdi:crown" class="text-sm text-[#121212]" />
          </div>
          <div class="flex flex-col min-w-0">
            <span
              class="text-[10px] font-headline font-black uppercase tracking-wider text-[#121212]/60 leading-none"
            >
              Casting Host
            </span>
            <span
              class="text-sm font-headline font-black uppercase tracking-tight text-[#121212] truncate leading-tight"
            >
              {$gameState.name || "Host"}
            </span>
          </div>
        </div>

        {#if !isEditingName}
          <button
            type="button"
            class="btn btn-xs bg-[#ECE6DA] hover:bg-[#F0C020] border-2 border-[#121212] font-headline font-black text-[11px] uppercase tracking-wider px-2.5 py-1 flex items-center gap-1 shrink-0 cursor-pointer shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            onclick={startEditName}
          >
            <Icon icon="mdi:pencil" class="text-xs" />
            <span>Rename</span>
          </button>
        {/if}
      </div>

      {#if isEditingName}
        <form
          class="flex items-center gap-1.5 pt-1 border-t-2 border-[#121212]/15"
          onsubmit={(e) => {
            e.preventDefault();
            saveName();
          }}
        >
          <input
            type="text"
            bind:value={editNameInput}
            maxlength={10}
            placeholder="New Name"
            autofocus
            class="input input-xs bg-white border-2 border-[#121212] text-xs font-headline font-bold uppercase tracking-wider flex-1 px-2 h-7 focus:outline-none focus:bg-[#FFFEEA]"
          />
          <button
            type="submit"
            class="btn btn-xs bg-[#20B050] text-white hover:bg-[#1a9443] border-2 border-[#121212] shadow-[2px_2px_0px_#121212] font-headline font-black text-[11px] uppercase px-2 h-7 cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onclick={cancelEditName}
            class="btn btn-xs bg-[#ECE6DA] hover:bg-[#ddd4c4] border-2 border-[#121212] shadow-[2px_2px_0px_#121212] font-headline font-black text-[11px] uppercase px-2 h-7 cursor-pointer"
          >
            ✕
          </button>
        </form>
      {:else if ($gameState.name === "Host" || !$gameState.name)}
        <div class="text-[10px] font-display font-bold text-[#1040C0] uppercase tracking-wide flex items-center gap-1 bg-[#1040C0]/10 px-1.5 py-0.5 border border-[#1040C0]/30">
          <Icon icon="mdi:information-outline" class="text-xs shrink-0" />
          <span>Default name set. Tap 'Rename' to customize!</span>
        </div>
      {/if}
    </div>

    <!-- Controller Header / Directives -->
    <CatchphraseRecorder />

    <!-- Joystick / D-Pad Pad -->
    <div
      bind:this={padElement}
      onpointerdown={handlePointerDown}
      onpointermove={handlePointerMove}
      onpointerup={handlePointerUp}
      onpointercancel={handlePointerCancel}
      class="relative w-full aspect-square max-w-[17.5rem] bg-[#ECE6DA] border-3 border-[#121212] shadow-[4px_4px_0px_#121212] flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
      style="touch-action: none;"
    >
      <!-- Background Crosshair Axis Lines -->
      <div
        class="absolute inset-0 pointer-events-none flex items-center justify-center"
      >
        <div class="w-full h-[2px] bg-[#121212]/15"></div>
        <div class="h-full w-[2px] bg-[#121212]/15 absolute"></div>
        <div
          class="w-28 h-28 border-2 border-dashed border-[#121212]/20 rounded-full absolute"
        ></div>
      </div>

      <!-- Up Arrow Button -->
      <button
        type="button"
        class="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-11 flex flex-col items-center justify-center border-2 border-[#121212] transition-all cursor-pointer z-10 font-headline font-black text-xs uppercase tracking-wider {activeDir ===
        'up'
          ? 'bg-[#F0C020] text-[#121212] '
          : 'bg-white text-[#121212] hover:bg-[#F0C020]'}"
        onclick={(e) => {
          e.stopPropagation();
          triggerArrow("up");
        }}
        aria-label="Up"
      >
        <Icon icon="mdi:chevron-up" class="text-3xl leading-none -mb-1" />
      </button>

      <!-- Down Arrow Button -->
      <button
        type="button"
        class="absolute bottom-2 left-1/2 -translate-x-1/2 w-14 h-11 flex flex-col items-center justify-center border-2 border-[#121212] transition-all cursor-pointer z-10 font-headline font-black text-xs uppercase tracking-wider {activeDir ===
        'down'
          ? 'bg-[#F0C020] text-[#121212] '
          : 'bg-white text-[#121212]  hover:bg-[#F0C020]'}"
        onclick={(e) => {
          e.stopPropagation();
          triggerArrow("down");
        }}
        aria-label="Down"
      >
        <Icon icon="mdi:chevron-down" class="text-3xl leading-none -mt-1" />
      </button>

      <!-- Left Arrow Button -->
      <button
        type="button"
        class="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-14 flex flex-col items-center justify-center border-2 border-[#121212] transition-all cursor-pointer z-10 font-headline font-black text-xs uppercase tracking-wider {activeDir ===
        'left'
          ? 'bg-[#F0C020] text-[#121212] '
          : 'bg-white text-[#121212]  hover:bg-[#F0C020]'}"
        onclick={(e) => {
          e.stopPropagation();
          triggerArrow("left");
        }}
        aria-label="Left"
      >
        <Icon icon="mdi:chevron-left" class="text-3xl leading-none" />
      </button>

      <!-- Right Arrow Button -->
      <button
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-14 flex flex-col items-center justify-center border-2 border-[#121212] transition-all cursor-pointer z-10 font-headline font-black text-xs uppercase tracking-wider {activeDir ===
        'right'
          ? 'bg-[#F0C020] text-[#121212] '
          : 'bg-white text-[#121212]  hover:bg-[#F0C020]'}"
        onclick={(e) => {
          e.stopPropagation();
          triggerArrow("right");
        }}
        aria-label="Right"
      >
        <Icon icon="mdi:chevron-right" class="text-3xl leading-none" />
      </button>

      <!-- Center Draggable Joystick Ball (Thumbstick Knob) -->
      <div
        class="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#D02020] border-3 border-[#121212] shadow-[3px_3px_0px_#121212] flex flex-col items-center justify-center pointer-events-none z-20 transition-transform {isDragging
          ? 'duration-0 scale-105'
          : 'duration-200 ease-out'}"
        style="transform: translate({ballX}px, {ballY}px);"
      >
        <!-- Center Target / Crosshair -->
        <div
          class="w-6 h-6 rounded-full border-2 border-white/80 flex items-center justify-center"
        >
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
    </div>

    <!-- Instruction Subtext -->

    <!-- Prominent Action Buttons: BACK & SELECT -->
    <div class="grid grid-cols-2 gap-3 w-full max-w-[17.5rem]">
      <!-- Back Button -->
      <button
        type="button"
        class="btn btn-secondary h-12 flex items-center justify-center gap-0 p-2 font-headline uppercase tracking-wider text-sm border-3 border-[#121212] shadow-[4px_4px_0px_#121212]"
        onclick={() => sendNav("back")}
        aria-label="Back"
        title="Back"
      >
        <Icon icon="mdi:arrow-left" class="text-lg" />
        <span>Back</span>
      </button>

      <!-- Select Button -->
      <button
        type="button"
        class="btn btn-primary h-12 flex items-center justify-center gap-0 p-2 font-headline uppercase tracking-wider text-sm border-3 border-[#121212] shadow-[4px_4px_0px_#121212]"
        onclick={() => sendNav("select")}
        aria-label="Select"
        title="Select"
      >
        <Icon icon="mdi:cursor-default-click" class="text-lg" />
        <span>Select</span>
      </button>
    </div>

    {#if !$session.data?.user}
      <div
        class="text-center font-display font-medium text-xs text-[#121212]/80 mt-0.5"
      >
        (
        <span
          class="font-headline font-bold text-[#1040C0] hover:underline cursor-pointer uppercase"
          onclick={() => sideBarOpen.set(true)}
        >
          Sign In
        </span>
        to customize avatar)
      </div>
    {/if}
  </div>
</div>
