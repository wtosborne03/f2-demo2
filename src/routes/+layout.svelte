<script lang="ts">
  import "../app.postcss";
  import { AppShell, AppBar } from "@skeletonlabs/skeleton";
  import { Toast, initializeStores } from "@skeletonlabs/skeleton";
  import type { PlayerState } from "../types/player_state";

  // Floating UI for Popups
  import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from "@floating-ui/dom";
  import { storePopup } from "@skeletonlabs/skeleton";
  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  import { player_state } from "../stores/player_state"; // Assuming you have a timer store

  import doubloon from "$lib/assets/icons/doubloon.png";

  let score = 0;
  let name = "";
  let admin = false;

  let timer_duration = 0;
  let time_left = 0;
  let timer_running = false;
  let timer: any;

  function startTimer(duration: number) {
    timer_running = true;
    timer_duration = duration;
    time_left = duration;
    timer = setInterval(() => {
      time_left--;
      if (time_left <= 0) {
        clearInterval(timer);
        timer_running = false;
      }
    }, 1000);
  }

  function stopTimer() {
    timer_running = false;
    clearInterval(timer);
  }

  player_state.subscribe((value: PlayerState) => {
    score = value.score;
    name = value.name;
    admin = value.admin;
    if (value.timer > 0) {
      startTimer(value.timer);
    } else {
      stopTimer();
    }
  });

  initializeStores();
</script>

<Toast />
<!-- App Shell -->
<div class="fixed w-full z-10">
  <!-- App Bar -->
  <AppBar
    gridColumns="grid-cols-3"
    slotDefault="place-self-center"
    slotTrail="place-content-end"
  >
    <svelte:fragment slot="lead">
      <strong class="text-xl uppercase">JG</strong>
    </svelte:fragment>
    <span class="text-xl flex flex-col justify-center items-center gap-0"
      >{name}{#if admin}
        <span class="text-sm">[admin]</span>
      {/if}</span
    >

    <svelte:fragment slot="trail">
      <span class="text-xl flex flex-row items-center justify-center gap-2"
        >{score}
        <img class="w-8 h-8" src={doubloon} alt="coin" /></span
      >
    </svelte:fragment>

    <!-- Countdown Bar -->
    {#if timer_running}
      <div class="w-screen bg-gray-200 h-2 mt-2 col-span-3">
        <div
          class="bg-blue-500 h-full"
          style="width: {(100 * time_left) / timer_duration}%"
        ></div>
      </div>
    {/if}
  </AppBar>
</div>

<div class="h-24"></div>
<!-- Page Route Content -->
<div class="flex-grow">
  <slot />
</div>
