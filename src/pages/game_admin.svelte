<script lang="ts">
  import { sendMessage } from "$lib/index";
  import { playerEmote } from "$lib/player_emote";
  import {
    SlideToggle,
    RangeSlider,
    getDrawerStore,
    getModalStore,
  } from "@skeletonlabs/skeleton";
  import type { ModalSettings } from "@skeletonlabs/skeleton";
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
  <h3 class="mt-12">Settings</h3>
  <div class="p-4 border-2 border-white rounded-xl">
    <div class="flex flex-row justify-between items-center">
      <div class="mr-4">Drinking Game:</div>
      <SlideToggle name="slide" bind:checked={s_data.settings.drinking} />
    </div>
    <div class="flex flex-row justify-between items-center mt-4">
      <div class="mr-4">Subtitles:</div>
      <SlideToggle name="slide" bind:checked={s_data.settings.subtitles} />
    </div>
    <div class="flex flex-row justify-between items-center mt-4">
      <div class="mr-4">Music Volume:</div>
      <RangeSlider
        name="range-slider"
        bind:value={s_data.settings.music_volume}
        max={0.5}
        step={0.1}
        ticked
      ></RangeSlider>
    </div>
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
