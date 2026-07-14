<script lang="ts">
  import { playerEmote } from "$lib/avatar/player_emote";
  import { sideBarOpen } from "../stores/sidebar";
  import { authClient } from "../stores/authStore";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import type { settings } from "../types/settings";
  import Icon from "@iconify/svelte";

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

  function promptForStart() {
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
  class="flex flex-col justify-between min-h-full w-full max-w-md mx-auto px-6 py-8"
  onclick={playerEmote}
>
  <div class="w-full mt-4 mb-6">
    <button 
      type="button" 
      class="btn btn-primary btn-lg w-full text-lg font-bold flex items-center justify-center gap-2" 
      onclick={promptForStart}
    >
      <span>Start Game</span>
      <Icon icon="mdi:play" class="text-xl" />
    </button>
  </div>

  <section class="w-full flex-grow">
    <h3 class="text-xl font-black mb-4">Settings</h3>

    <ul class="flex flex-col gap-4">
      <!-- Drinking Game Setting -->
      <li class="card bg-base-200 border border-base-300 shadow-sm p-4 hover:bg-base-200/80 transition-colors">
        <label class="label cursor-pointer flex justify-between items-center w-full p-0">
          <span class="text-base font-bold">Drinking Game 🍺</span>
          <input 
            type="checkbox" 
            class="toggle toggle-primary toggle-md" 
            bind:checked={s_data.drinking} 
            onchange={sendSettings} 
          />
        </label>
      </li>

      <!-- Family Mode Setting -->
      <li class="card bg-base-200 border border-base-300 shadow-sm p-4 hover:bg-base-200/80 transition-colors">
        <label class="label cursor-pointer flex justify-between items-center w-full p-0">
          <span class="text-base font-bold">Family Mode 👨‍👩‍👧‍👦</span>
          <input 
            type="checkbox" 
            class="toggle toggle-primary toggle-md" 
            bind:checked={s_data.family} 
            onchange={sendSettings} 
          />
        </label>
      </li>

      <!-- End Condition Selection -->
      <li class="card bg-base-200 border border-base-300 shadow-sm p-4 flex flex-col gap-4">
        <span class="text-base font-bold">End Condition 🏁</span>

        <div class="tabs tabs-box bg-base-300 p-1 rounded-xl w-full flex">
          <button
            type="button"
            class="tab flex-1 font-medium transition-all"
            class:tab-active={endConditionTab === "tab-rounds"}
            onclick={() => { endConditionTab = "tab-rounds"; }}
          >
            Rounds
          </button>
          <button
            type="button"
            class="tab flex-1 font-medium transition-all"
            class:tab-active={endConditionTab === "tab-doubloons"}
            onclick={() => { endConditionTab = "tab-doubloons"; }}
          >
            Doubloons
          </button>
        </div>

        <div class="w-full pt-2">
          {#if endConditionTab === "tab-rounds"}
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-semibold opacity-70">Total Rounds</span>
                <span class="text-base font-black text-primary">{s_data.rounds}</span>
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
            </div>
          {:else}
            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-semibold opacity-70">Doubloons To Win</span>
                <span class="text-base font-black text-primary">{s_data.doubloons.toLocaleString()}</span>
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
            </div>
          {/if}
        </div>
      </li>
    </ul>
  </section>

  {#if !$session.data?.user}
    <div class="text-center text-xs opacity-60 mt-8 mb-4">
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
