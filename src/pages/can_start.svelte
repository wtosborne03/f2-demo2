<script lang="ts">
  import { sideBarOpen } from "../stores/sidebar";
  import { authClient } from "../stores/authStore";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import type { settings } from "../types/settings";
  import Icon from "@iconify/svelte";
  import CatchphraseRecorder from "$lib/components/CatchphraseRecorder.svelte";

  const session = authClient.useSession();

  // Create local reactive state representing the settings
  let s_data = $state<settings>({
    drinking: false,
    family: false,
    rounds: 10,
    doubloons: 5000,
    endCondition: 0,
  });

  let endConditionTab = $state("tab-rounds");
  let hasInitialized = false;

  // Keep s_data synchronized with server-side gameState changes only once upon mount/load
  $effect(() => {
    const currentSettings = $gameState.page_data?.settings;
    if (currentSettings && !hasInitialized) {
      s_data.drinking = currentSettings.drinking;
      s_data.family = currentSettings.family;
      s_data.rounds = currentSettings.rounds;
      s_data.doubloons = currentSettings.doubloons;
      s_data.endCondition = currentSettings.endCondition;
      if (currentSettings.endCondition === 1) {
        endConditionTab = "tab-doubloons";
      } else {
        endConditionTab = "tab-rounds";
      }
      hasInitialized = true;
    }
  });

  // Function to send updated settings to the server
  function sendSettings() {
    gameClient.sendInput({
      type: "update_settings",
      settings: {
        drinking: s_data.drinking,
        family: s_data.family,
        rounds: s_data.rounds,
        doubloons: s_data.doubloons,
        endCondition: s_data.endCondition,
      },
    });
  }

  // Handle updates from tab changes
  $effect(() => {
    const targetEndCondition = endConditionTab === "tab-rounds" ? 0 : 1;
    if (s_data.endCondition !== targetEndCondition) {
      s_data.endCondition = targetEndCondition;
      sendSettings();
    }
  });

  let confirmModal = $state<HTMLDialogElement>();

  function promptForStart() {
    confirmModal?.showModal();
  }

  function confirmStart() {
    confirmModal?.close();
    startGame();
  }

  function startGame() {
    gameClient.sendInput({
      type: "start_game",
    });
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="flex flex-col w-full max-w-md mx-auto px-4 py-4 sm:py-6 pb-28 my-auto max-h-full gap-3"
>
  <!-- Catchphrase Recorder on top of settings box -->
  <div class="w-full">
    <CatchphraseRecorder />
  </div>

  <!-- Consolidated DaisyUI Card Container -->
  <div
    class="card bg-base-200 border border-base-300 shadow-xl p-4 sm:p-5 w-full flex flex-col gap-3.5"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon icon="mdi:cog" class="text-primary text-xl" />
        <h2 class="text-lg font-black tracking-wide">Game Settings</h2>
      </div>
    </div>

    <!-- Game Modes (Inline 2-Column Row) -->
    <div class="grid grid-cols-2 gap-2.5">
      <!-- Drinking Game Setting -->
      <div
        class="form-control bg-base-300/40 border border-base-300/60 rounded-xl px-3 py-2"
      >
        <label
          class="label cursor-pointer p-0 flex justify-between items-center w-full"
        >
          <span class="text-md font-bold flex items-center gap-1">
            Drinking 🍺
          </span>
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-md"
            bind:checked={s_data.drinking}
            onchange={sendSettings}
          />
        </label>
      </div>

      <!-- Family Mode Setting -->
      <div
        class="form-control bg-base-300/40 border border-base-300/60 rounded-xl px-3 py-2"
      >
        <label
          class="label cursor-pointer p-0 flex justify-between items-center w-full"
        >
          <span class="text-md font-bold flex items-center gap-1">
            Family 👥
          </span>
          <input
            type="checkbox"
            class="toggle toggle-primary toggle-md"
            bind:checked={s_data.family}
            onchange={sendSettings}
          />
        </label>
      </div>
    </div>

    <!-- Divider -->
    <div class="divider my-0"></div>

    <!-- End Condition Section -->
    <div class="flex flex-col gap-2">
      <div class="flex justify-between items-center">
        <span class="text-sm font-bold flex items-center gap-1.5">
          <Icon icon="mdi:flag-checkered" class="text-primary text-base" />
          End Condition
        </span>

        <!-- Segmented Button (DaisyUI join) -->
        <div
          class="join border border-base-300 rounded-lg p-0.5 bg-base-300/50"
        >
          <button
            type="button"
            class="btn btn-xs sm:btn-sm join-item font-semibold transition-all {endConditionTab ===
            'tab-rounds'
              ? 'btn-primary shadow-sm'
              : 'btn-ghost'}"
            onclick={() => {
              endConditionTab = "tab-rounds";
            }}
          >
            Rounds
          </button>
          <button
            type="button"
            class="btn btn-xs sm:btn-sm join-item font-semibold transition-all {endConditionTab ===
            'tab-doubloons'
              ? 'btn-primary shadow-sm'
              : 'btn-ghost'}"
            onclick={() => {
              endConditionTab = "tab-doubloons";
            }}
          >
            Doubloons
          </button>
        </div>
      </div>

      <!-- Slider & Value Badge -->
      <div
        class="bg-base-300/30 border border-base-300/50 rounded-xl p-3 flex flex-col gap-2"
      >
        {#if endConditionTab === "tab-rounds"}
          <div class="flex justify-between items-center">
            <span class="text-xs font-semibold opacity-70">Total Rounds</span>
            <span
              class="badge badge-neutral font-mono font-bold text-primary text-sm px-2.5 py-0.5"
            >
              {s_data.rounds}
            </span>
          </div>
          <input
            type="range"
            class="range range-primary range-sm w-full"
            bind:value={s_data.rounds}
            min={10}
            max={100}
            step={1}
            onchange={sendSettings}
          />
        {:else}
          <div class="flex justify-between items-center">
            <span class="text-xs font-semibold opacity-70"
              >Doubloons To Win</span
            >
            <span
              class="badge badge-neutral font-mono font-bold text-primary text-sm px-2.5 py-0.5"
            >
              {s_data.doubloons.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            class="range range-primary range-sm w-full"
            bind:value={s_data.doubloons}
            min={5000}
            max={100000}
            step={1000}
            onchange={sendSettings}
          />
        {/if}
      </div>
    </div>

    <!-- Divider -->
    <div class="divider my-0"></div>

    <!-- Actions & Hierarchy: Start Button at bottom -->
    <div class="flex flex-col gap-1.5 pt-1">
      <button
        type="button"
        class="btn btn-success text-success-content btn-block text-base font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
        onclick={promptForStart}
      >
        <span>Start Game</span>
        <Icon icon="mdi:play" class="text-xl" />
      </button>

      {#if !$session.data?.user}
        <div class="text-center text-xs opacity-60 mt-4">
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

  <!-- DaisyUI Confirmation Modal -->
  <dialog bind:this={confirmModal} class="modal modal-bottom sm:modal-middle">
    <div class="modal-box text-center">
      <h3 class="text-xl font-black mb-2">Start Game?</h3>
      <p class="py-2 text-base opacity-80">
        Make sure everybody has joined before starting!
      </p>
      <div class="modal-action flex justify-center gap-3 mt-6">
        <form method="dialog">
          <button class="btn btn-ghost border border-base-300">Cancel</button>
        </form>
        <button
          type="button"
          class="btn btn-success text-success-content font-bold flex items-center gap-2"
          onclick={confirmStart}
        >
          <span>Everybody's In!</span>
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
</div>
