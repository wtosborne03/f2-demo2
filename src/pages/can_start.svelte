<script lang="ts">
  import { sendMessage } from "$lib/webSocketService";
  import { playerEmote } from "$lib/avatar/player_emote";
  import { Tabs, Switch } from "@skeletonlabs/skeleton-svelte";
  import {} from "@skeletonlabs/skeleton-svelte";
  import type { adminStartData } from "../types/page_data";
  import { get } from "svelte/store";
  import { player_state } from "../stores/player_state";
  import { drawerSettings } from "$lib/config/drawer";
  import { sideBarOpen } from "../stores/sidebar";
  import { authClient } from "../stores/authStore";
  import { gameClient } from "$lib/gameService";
  import type { AdminStartData } from "$lib/wsapi/game";
  import type { settings } from "../types/settings";
  import Icon from "@iconify/svelte";

  const session = authClient.useSession();

  let s_data: settings;
  s_data = get(player_state).pageData.settings;

  $: s_data,
    gameClient.sendPlayerInput({
      payload: {
        $case: "adminStartData",
        adminStartData: {
          settings: s_data,
        },
      },
    });

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
    gameClient.sendPlayerInput({
      payload: {
        $case: "startGame",
        startGame: {},
      },
    });
  }
  let tabSet: number = 0;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="container h-full mx-auto flex flex-col justify-center items-center"
  on:click={playerEmote}
>
  <button
    class="btn rounded-2xl text-white preset-filled-secondary-500 py-3"
    on:click={promptForStart}
    >Start Game <Icon icon="mdi:play" font-size="1.8rem" /></button
  >

  <div class="container max-w-96">
    <h3 class="mt-8 mb-2 pl-2 text-lg">Settings</h3>
    <ul>
      <li
        class="flex flex-row justify-between items-center p-4 rounded-lg bg-slate-800 bg-opacity-40"
      >
        <Switch
          checked={s_data.drinking}
          onCheckedChange={(e) => {
            s_data.drinking = e.checked;
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
          checked={s_data.family}
          onCheckedChange={(e) => {
            s_data.family = e.checked;
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
          <div class="text-start text-gray-200 font-bold mb-4">Game End 🏁</div>
          <Tabs.List class="h-10">
            <Tabs.Trigger class="flex-1" value="tab-rounds">
              <span class="italic"> Rounds</span>
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
                bind:value={s_data.rounds}
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
                bind:value={s_data.doubloons}
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
        on:click={() => sideBarOpen.set(true)}>Sign In</span
      > to customize avatar.)
    </div>
  {/if}
</div>
