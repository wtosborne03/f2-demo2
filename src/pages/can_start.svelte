<script lang="ts">
  import { sideBarOpen } from "../stores/sidebar";
  import { authClient } from "../stores/authStore";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import Icon from "@iconify/svelte";
  import CatchphraseRecorder from "$lib/components/CatchphraseRecorder.svelte";

  const session = authClient.useSession();

  // Send directional and action inputs to the host lobby screen
  function sendNav(action: "up" | "down" | "left" | "right" | "select" | "back" | "favorite" | "details" | "start") {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch (e) {}
    }
    gameClient.sendInput({
      type: "lobby_nav",
      action: action,
    });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="flex flex-col w-full max-w-md mx-auto px-4 py-4 sm:py-6 pb-28 my-auto max-h-full gap-3.5 items-center select-none"
>
  <!-- Catchphrase Recorder on top -->
  <div class="w-full">
    <CatchphraseRecorder />
  </div>

  <!-- DaisyUI / Material Design TV Remote Card Container -->
  <div
    class="card bg-base-200 border border-base-300 shadow-2xl p-5 sm:p-6 w-full flex flex-col items-center gap-5"
  >
    <!-- Remote Top Header -->
    <div class="flex items-center justify-between w-full border-b border-base-300 pb-3">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
          <Icon icon="mdi:television-box" class="text-xl" />
        </div>
        <div>
          <h2 class="text-base font-black tracking-wide leading-tight">Lobby TV Remote</h2>
          <p class="text-[0.7rem] opacity-60 font-medium">Control the Main Screen</p>
        </div>
      </div>

      {#if $gameState.roomCode}
        <div class="badge badge-primary badge-outline font-mono font-black text-xs tracking-widest px-2.5 py-1">
          {$gameState.roomCode}
        </div>
      {/if}
    </div>

    <!-- D-Pad Directional Controller (Material Tactile Diamond Layout) -->
    <div class="relative w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center my-1">
      <!-- D-Pad Circular Background Housing -->
      <div class="absolute inset-0 rounded-full bg-base-300/60 border-2 border-base-300 shadow-inner flex items-center justify-center pointer-events-none" />

      <!-- Up Button -->
      <button
        type="button"
        class="absolute top-2 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-base-100 hover:bg-base-300 active:bg-primary active:text-primary-content border border-base-300 shadow-md flex items-center justify-center text-2xl active:scale-95 transition-all cursor-pointer z-10"
        onclick={() => sendNav("up")}
        aria-label="Navigate Up"
      >
        <Icon icon="mdi:chevron-up" />
      </button>

      <!-- Down Button -->
      <button
        type="button"
        class="absolute bottom-2 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-base-100 hover:bg-base-300 active:bg-primary active:text-primary-content border border-base-300 shadow-md flex items-center justify-center text-2xl active:scale-95 transition-all cursor-pointer z-10"
        onclick={() => sendNav("down")}
        aria-label="Navigate Down"
      >
        <Icon icon="mdi:chevron-down" />
      </button>

      <!-- Left Button -->
      <button
        type="button"
        class="absolute left-2 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-base-100 hover:bg-base-300 active:bg-primary active:text-primary-content border border-base-300 shadow-md flex items-center justify-center text-2xl active:scale-95 transition-all cursor-pointer z-10"
        onclick={() => sendNav("left")}
        aria-label="Navigate Left"
      >
        <Icon icon="mdi:chevron-left" />
      </button>

      <!-- Right Button -->
      <button
        type="button"
        class="absolute right-2 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-base-100 hover:bg-base-300 active:bg-primary active:text-primary-content border border-base-300 shadow-md flex items-center justify-center text-2xl active:scale-95 transition-all cursor-pointer z-10"
        onclick={() => sendNav("right")}
        aria-label="Navigate Right"
      >
        <Icon icon="mdi:chevron-right" />
      </button>

      <!-- Center Select / OK Button -->
      <button
        type="button"
        class="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-primary text-primary-content hover:brightness-110 active:scale-90 shadow-lg border-2 border-primary-content/20 flex flex-col items-center justify-center font-black text-sm transition-all cursor-pointer z-20"
        onclick={() => sendNav("select")}
        aria-label="Select / OK"
      >
        <Icon icon="mdi:check-bold" class="text-xl sm:text-2xl" />
        <span class="text-[0.65rem] tracking-wider uppercase font-black -mt-0.5">OK</span>
      </button>
    </div>

    <!-- Remote Action Buttons Grid -->
    <div class="grid grid-cols-3 gap-2.5 w-full pt-1">
      <!-- Back Button -->
      <button
        type="button"
        class="btn btn-neutral btn-md rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 py-2 shadow-md active:scale-95 transition-transform"
        onclick={() => sendNav("back")}
      >
        <Icon icon="mdi:keyboard-return" class="text-lg" />
        <span class="text-xs font-semibold">Back</span>
      </button>

      <!-- Star / Favorite Button -->
      <button
        type="button"
        class="btn btn-warning text-warning-content btn-md rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 py-2 shadow-md active:scale-95 transition-transform"
        onclick={() => sendNav("favorite")}
      >
        <Icon icon="mdi:star" class="text-lg" />
        <span class="text-xs font-semibold">Favorite</span>
      </button>

      <!-- Details / Info Button -->
      <button
        type="button"
        class="btn btn-info text-info-content btn-md rounded-2xl font-bold flex flex-col items-center justify-center gap-0.5 py-2 shadow-md active:scale-95 transition-transform"
        onclick={() => sendNav("details")}
      >
        <Icon icon="mdi:information-outline" class="text-lg" />
        <span class="text-xs font-semibold">Inspect</span>
      </button>
    </div>

    <!-- Primary Launch CTA (Full Width) -->
    <div class="w-full pt-1">
      <button
        type="button"
        class="btn btn-success text-success-content btn-block btn-lg rounded-2xl text-base sm:text-lg font-black shadow-xl flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform"
        onclick={() => sendNav("select")}
      >
        <Icon icon="mdi:play" class="text-2xl" />
        <span>Launch / Select (A)</span>
      </button>
    </div>

    <!-- Quick Navigation Tips -->
    <div class="text-center text-xs opacity-60 flex items-center justify-center gap-1.5 pt-1">
      <Icon icon="mdi:gesture-tap" class="text-base text-primary opacity-80" />
      <span>Tap buttons to browse games & modes on the TV</span>
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
