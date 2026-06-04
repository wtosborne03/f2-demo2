<script lang="ts">
  import { playerEmote } from "$lib/avatar/player_emote";
  import { Switch, Tabs, Slider, Button } from "m3-svelte";
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
<div class="can-start-container" onclick={playerEmote}>
  <div class="spacer-flex"></div>

  <div class="start-btn-wrapper">
    <Button variant="filled" size="l" onclick={promptForStart}>
      Start Game
      <Icon icon="mdi:play" />
    </Button>
  </div>

  <section class="settings-section">
    <h3 class="settings-title">Settings</h3>

    <ul class="settings-list">
      <li class="settings-item">
        <label class="switch-label">
          <span class="label-text">Drinking Game 🍺</span>
          <Switch bind:checked={s_data.drinking} onchange={sendSettings} />
        </label>
      </li>

      <li class="settings-item">
        <label class="switch-label">
          <span class="label-text">Family Mode 👨‍👩‍👧‍👦</span>
          <Switch bind:checked={s_data.family} onchange={sendSettings} />
        </label>
      </li>

      <li class="settings-item tabs-item">
        <span class="tabs-title">End Condition 🏁</span>

        <div class="tabs-container">
          <Tabs
            items={[
              { name: "Rounds", value: "tab-rounds" },
              { name: "Doubloons", value: "tab-doubloons" },
            ]}
            bind:tab={endConditionTab}
            secondary
          />
        </div>

        <div class="tabs-content">
          {#if endConditionTab === "tab-rounds"}
            <div class="slider-wrapper">
              <div class="slider-label-row">
                <span class="slider-label">Total Rounds</span>
                <span class="slider-value-display">{s_data.rounds}</span>
              </div>
              <Slider
                bind:value={s_data.rounds}
                min={10}
                max={100}
                step={1}
                onchange={sendSettings}
              />
            </div>
          {:else}
            <div class="slider-wrapper">
              <div class="slider-label-row">
                <span class="slider-label">Doubloons To Win</span>
                <span class="slider-value-display"
                  >{s_data.doubloons.toLocaleString()}</span
                >
              </div>
              <Slider
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
    <div class="signin-helper">
      (
      <span class="signin-link" onclick={() => sideBarOpen.set(true)}
        >Sign In</span
      > to customize avatar.)
    </div>
  {/if}
  <div class="spacer-flex"></div>
</div>

<style>
  .can-start-container {
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 36rem;
    padding: 1rem;
    box-sizing: border-box;
    min-height: 100%;
  }

  .spacer-flex {
    flex-grow: 1;
  }

  .start-btn-wrapper {
    width: 100%;
    margin-bottom: 2.5rem;
  }

  .start-btn-wrapper > :global(*) {
    width: 100%;
    padding: 1.75rem 0;
    font-size: 1.25rem;
  }

  .settings-section {
    width: 100%;
  }

  .settings-title {
    font-family: var(--m3-font);
    font-size: 1.375rem;
    line-height: 1.273;
    font-weight: 400;
    color: var(--m3c-on-background);
    margin-bottom: 1rem;
    margin-top: 0;
  }

  .settings-list {
    list-style-type: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .settings-item {
    background-color: var(--m3c-surface-container-low);
    border-radius: var(--m3-shape-large);
    padding: 1.25rem;
    border: 1px solid var(--m3c-outline-variant);
    transition:
      background-color 0.25s cubic-bezier(0.2, 0, 0, 1),
      border-color 0.25s cubic-bezier(0.2, 0, 0, 1);
  }

  .settings-item:hover {
    background-color: var(--m3c-surface-container);
    border-color: var(--m3c-outline);
  }

  .switch-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    cursor: pointer;
    user-select: none;
  }

  .label-text {
    font-family: var(--m3-font);
    font-size: 1.05rem;
    line-height: 1.5;
    font-weight: 500;
    color: var(--m3c-on-surface);
  }

  .tabs-item {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tabs-title {
    font-family: var(--m3-font);
    font-size: 1.05rem;
    line-height: 1.5;
    font-weight: 500;
    color: var(--m3c-on-surface);
  }

  .tabs-container {
    width: 100%;
  }

  .tabs-container :global(.m3-container) {
    width: 100%;
  }

  .tabs-content {
    width: 100%;
    margin-top: 0.25rem;
  }

  .slider-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.5rem;
  }

  .slider-label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .slider-label {
    font-family: var(--m3-font);
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--m3c-on-surface-variant);
  }

  .slider-value-display {
    font-family: var(--m3-font);
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--m3c-primary);
  }

  .slider-wrapper :global(.m3-container) {
    width: 100%;
  }

  .signin-helper {
    font-family: var(--m3-font);
    font-size: 0.875rem;
    line-height: 1.429;
    font-weight: 400;
    color: var(--m3c-on-surface-variant);
    text-align: center;
    margin-top: 1rem;
  }

  .signin-link {
    color: var(--m3c-primary);
    cursor: pointer;
    text-decoration: underline;
  }
</style>
