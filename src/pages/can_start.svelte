<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { playerEmote } from "$lib/avatar/player_emote";
  import { Tabs, Switch } from "@skeletonlabs/skeleton-svelte";
  import {} from "@skeletonlabs/skeleton-svelte";
  import type { adminStartData } from "../types/page_data";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import { drawerSettings } from "$lib/config/drawer";
  import { authDialog } from "../stores/dialog";
  import { authClient } from "../stores/authStore";

  const session = authClient.useSession();

  let s_data: adminStartData;
  s_data = get<PlayerState>(player_state).page_data;

  $: s_data, sendMessage({ type: "settings", data: s_data.settings });

  function promptForStart() {
    // const modal: ModalSettings = {
    //   type: "confirm",
    //   title: "Everybody In? 🤔",
    //   body: "Once you start Couch Cup, new players cannot join. Are you sure you want to start?",
    //   response: (r: boolean) => {
    //     if (r) {
    //       startGame();
    //     }
    //   },
    // };
    // modalStore.trigger(modal);
    startGame();
  }

  function startGame() {
    sendMessage({ type: "start_game" });
  }
  let tabSet: number = 0;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="container h-full mx-auto flex flex-col justify-center items-center"
  on:click={playerEmote}
>
  <button class="btn preset-filled" on:click={promptForStart}
    >Start Game <i class=""></i></button
  >

  <div class="container max-w-96">
    <h3 class="mt-16 mb-2 pl-2 text-lg">Settings</h3>
    <ul>
      <li
        class="flex flex-row justify-between items-center p-4 rounded-lg bg-slate-800 bg-opacity-40"
      >
        <Switch
          checked={s_data.settings.drinking}
          onCheckedChange={(e) => {
            s_data.settings.drinking = e.checked;
          }}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Drinking Game 🍺</Switch.Label>
          <Switch.HiddenInput />
        </Switch>
      </li>

      <li
        class="mt-2 flex flex-row justify-between items-center p-4 rounded-lg bg-slate-800"
      >
        <Switch
          checked={s_data.settings.family}
          onCheckedChange={(e) => {
            s_data.settings.family = e.checked;
          }}
        >
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Family Mode</Switch.Label>
          <Switch.HiddenInput />
        </Switch>
      </li>

      <!-- Game End Condition Settings -->
      <li class="mt-2 p-4 rounded-lg bg-slate-800 bg-opacity-40">
        <Tabs defaultValue="tab-rounds">
          <div class="text-center text-gray-200 font-bold mr-3 mb-6">
            Game End 🏁
          </div>
          <Tabs.List>
            <Tabs.Trigger class="flex-1" value="tab-rounds">
              <span class="italic"> Rounds </span>
            </Tabs.Trigger>
            <Tabs.Trigger class="flex-1" value="tab-doubloons">
              <span class="italic"> Doubloons</span></Tabs.Trigger
            >
            <Tabs.Indicator />
          </Tabs.List>
          <!-- Tab Panels --->
          <Tabs.Content value="tab-rounds">
            <div class="flex flex-row justify-between items-center">
              <input
                id="rounds"
                type="number"
                class="border m-2 p-2 rounded-md w-full"
                min="10"
                max="100"
                step="1"
                bind:value={s_data.settings.rounds}
              />
              <span class="ml-2 w-64">Game Rounds</span>
            </div>
          </Tabs.Content>
          <Tabs.Content value="tab-doubloons">
            <div class="flex flex-row justify-between items-center">
              <input
                id="points"
                type="number"
                class="border m-2 p-2 rounded-md w-full"
                min="5000"
                max="100000"
                step="1000"
                bind:value={s_data.settings.doubloons}
              />
              <span class="ml-2 w-64">Doubloons To Win</span>
            </div>
          </Tabs.Content>
        </Tabs>
      </li>
    </ul>
  </div>

  {#if $session.data?.user}
    <div class=""></div>
  {:else}
    <div class="mt-16 opacity-75">
      (
      <span
        class="cursor-pointer text-blue-500 hover:text-blue-600"
        on:click={() => authDialog.set(true)}>Sign In</span
      > to customize avatar.)
    </div>
  {/if}
</div>
