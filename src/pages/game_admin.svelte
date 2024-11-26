<script lang="ts">
  import { sendMessage } from "$lib/index";
  import { playerEmote } from "$lib/player_emote";
  import {
    SlideToggle,
    RangeSlider,
    getDrawerStore,
    getModalStore,
    Tab,
  } from "@skeletonlabs/skeleton";
  import type { ModalSettings } from "@skeletonlabs/skeleton";
  import { TabGroup } from "@skeletonlabs/skeleton";
  import type { adminStartData } from "../types/page_data";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import { authStore } from "$lib/stores/authStore";
  import { drawerSettings } from "$lib/drawer";

  let s_data: adminStartData;
  s_data = get<PlayerState>(player_state).page_data;

  $: s_data, sendMessage({ type: "settings", data: s_data.settings });

  const drawerStore = getDrawerStore();
  const modalStore = getModalStore();

  function promptForStart() {
    const modal: ModalSettings = {
      type: "confirm",
      title: "Everybody In? 🤔",
      body: "Once you start Couch Cup, new players cannot join. Are you sure you want to start?",
      response: (r: boolean) => {
        if (r) {
          startGame();
        }
      },
    };
    modalStore.trigger(modal);
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
  <button class="btn variant-filled" on:click={promptForStart}
    >Start Game <i class=""></i></button
  >

  <div class="container max-w-96">
    <h3 class="mt-16 mb-2 pl-2">Settings</h3>
    <ul>
      <li
        class="flex flex-row justify-between items-center p-4 rounded-lg bg-slate-600 bg-opacity-40"
      >
        <div class="mr-4 italic text-gray-200 font-bold">Drinking Game 🍺</div>
        <SlideToggle name="slide" bind:checked={s_data.settings.drinking} />
      </li>

      <li
        class="mt-2 flex flex-row justify-between items-center p-4 rounded-lg bg-slate-600 bg-opacity-40"
      >
        <div class="mr-4 italic text-gray-200 font-bold">Family Mode 👦🏼</div>
        <SlideToggle name="slide" bind:checked={s_data.settings.family} />
      </li>

      <!-- Game End Condition Settings -->
      <li class="mt-2 p-4 rounded-lg bg-slate-600 bg-opacity-40">
        <TabGroup justify="justify-start">
          <div class="text-center italic text-gray-200 pt-2 font-bold mr-3">
            Game End 🏁
          </div>
          <Tab bind:group={s_data.settings.endCondition} name="tab1" value={0}>
            Rounds
          </Tab>
          <Tab bind:group={s_data.settings.endCondition} name="tab2" value={1}
            >Doubloons</Tab
          >
          <!-- Tab Panels --->
          <svelte:fragment slot="panel">
            {#if s_data.settings.endCondition === 0}
              <div class="flex flex-row justify-between items-center">
                <input
                  id="rounds"
                  type="number"
                  class="border border-gray-300 text-black rounded-md p-2 w-full"
                  min="10"
                  max="100"
                  step="1"
                  bind:value={s_data.settings.rounds}
                />
                <span class="ml-2 w-64">Game Rounds</span>
              </div>
            {:else if s_data.settings.endCondition === 1}
              <div class="flex flex-row justify-between items-center">
                <input
                  id="points"
                  type="number"
                  class="border border-gray-300 text-black rounded-md p-2 w-full"
                  min="5000"
                  max="100000"
                  step="1000"
                  bind:value={s_data.settings.doubloons}
                />
                <span class="ml-2 w-64">Doubloons To Win</span>
              </div>
            {/if}
          </svelte:fragment>
        </TabGroup>
      </li>
    </ul>
  </div>

  {#if $authStore.user}
    <div class=""></div>
  {:else}
    <div class="mt-16 opacity-75">
      (
      <span
        class="cursor-pointer text-blue-500 hover:text-blue-600"
        on:click={() => drawerStore.open(drawerSettings)}>Sign In</span
      > to customize avatar.)
    </div>
  {/if}
</div>
