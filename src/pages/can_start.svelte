<script lang="ts">
  import { playerEmote } from "$lib/avatar/player_emote";
  import { Tabs, Switch } from "@skeletonlabs/skeleton-svelte";
  import { get } from "svelte/store";
  import { sideBarOpen } from "../stores/sidebar";
  import { authClient } from "../stores/authStore";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import type { settings } from "../types/settings";
  import Icon from "@iconify/svelte";

  const session = authClient.useSession();

  let s_data: settings = get(gameState).page_data.settings;
  let endConditionTab =
    s_data.endCondition === 1 ? "tab-doubloons" : "tab-rounds";

  $: s_data,
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

  $: {
    const nextTab = s_data.endCondition === 1 ? "tab-doubloons" : "tab-rounds";
    if (endConditionTab !== nextTab) {
      endConditionTab = nextTab;
    }
  }

  function promptForStart() {
    startGame();
  }

  function startGame() {
    gameClient.sendInput({
      type: "start_game",
    });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="mx-auto flex h-full w-full max-w-xl flex-col gap-4 px-1 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4 sm:px-6"
  on:click={playerEmote}
>
  <div class="h-full"></div>

  <button
    class="btn preset-filled-secondary-500 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-lg font-semibold text-white shadow-lg"
    on:click={promptForStart}
  >
    Start Game
    <Icon icon="mdi:play" class="text-2xl" />
  </button>

  <div class="h-full"></div>

  <section class=" py-1">
    <h3 class="mb-3 text-lg font-semibold">Settings</h3>

    <ul class="space-y-3">
      <li class="rounded-xl bg-surface-300/50 p-4">
        <Switch
          class="flex w-full items-center justify-between gap-3"
          checked={s_data.drinking}
          onCheckedChange={(e) => {
            s_data.drinking = e.checked;
          }}
        >
          <div>
            <Switch.Label class="font-medium text-base"
              >Drinking Game 🍺</Switch.Label
            >
          </div>
          <Switch.Control class="shrink-0 scale-150 mr-4">
            <Switch.Thumb />
          </Switch.Control>
          <Switch.HiddenInput />
        </Switch>
      </li>

      <li class="rounded-xl bg-surface-300/50 p-4">
        <Switch
          class="flex w-full items-center justify-between gap-3"
          checked={s_data.family}
          onCheckedChange={(e) => {
            s_data.family = e.checked;
          }}
        >
          <div>
            <Switch.Label class="font-medium text-base"
              >Family Mode</Switch.Label
            >
          </div>
          <Switch.Control class="shrink-0 scale-150 mr-4">
            <Switch.Thumb />
          </Switch.Control>
          <Switch.HiddenInput />
        </Switch>
      </li>

      <li class="rounded-xl bg-surface-300/50 p-4">
        <Tabs
          class="w-full"
          value={endConditionTab}
          onValueChange={(e) => {
            endConditionTab = e.value;
            s_data.endCondition = e.value === "tab-rounds" ? 0 : 1;
          }}
        >
          <Tabs.List
            class="grid h-13 grid-cols-3 gap-2 rounded-lg items-center  p-1 pt-0"
          >
            <span class="text-sm font-semibold">End 🏁</span>
            <Tabs.Trigger
              class="rounded-md text-base font-medium"
              value="tab-rounds"
            >
              Rounds
            </Tabs.Trigger>
            <Tabs.Trigger
              class="rounded-md text-base font-medium"
              value="tab-doubloons"
            >
              Doubloons
            </Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>

          <Tabs.Content value="tab-rounds" class="pt-0">
            <label
              for="rounds"
              class="mb-1 block text-xs uppercase tracking-wide text-surface-300"
            >
              Total Rounds
            </label>
            <input
              id="rounds"
              type="number"
              class="w-full rounded-lg border border-surface-500/40 bg-surface-900/70 p-3 text-base"
              min="10"
              max="100"
              step="1"
              inputmode="numeric"
              bind:value={s_data.rounds}
            />
          </Tabs.Content>

          <Tabs.Content value="tab-doubloons" class="pt-0">
            <label
              for="points"
              class="mb-1 block text-xs uppercase tracking-wide text-surface-300"
            >
              Doubloons To Win
            </label>
            <input
              id="points"
              type="number"
              class="w-full rounded-lg border border-surface-500/40 bg-surface-900/70 p-3 text-base"
              min="5000"
              max="100000"
              step="1000"
              inputmode="numeric"
              bind:value={s_data.doubloons}
            />
          </Tabs.Content>
        </Tabs>
      </li>
    </ul>
  </section>

  {#if !$session.data?.user}
    <div class="px-2 text-center text-sm opacity-80">
      (
      <span
        class="cursor-pointer text-blue-400 hover:text-blue-300"
        on:click={() => sideBarOpen.set(true)}>Sign In</span
      > to customize avatar.)
    </div>
  {/if}
</div>
<div class="h-20"></div>
