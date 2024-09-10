<script lang="ts">
  import { writable } from "svelte/store";
  import "../app.postcss";
  import { AppShell, AppBar } from "@skeletonlabs/skeleton";
  import { Toast, initializeStores } from "@skeletonlabs/skeleton";
  import type { PlayerState } from "../types/player_state";
  import "./toolbar.svelte";

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
  import { onMount, onDestroy } from "svelte";

  let score = 0;
  let name = "";
  let admin = false;

  const remaining_time = writable(0); // Use a store for remaining_time

  const updateTimer = () => {
    remaining_time.set((new Date(timer_stamp).getTime() - Date.now()) / 1000);
  };
  let time_left = 0;

  remaining_time.subscribe((value) => {
    time_left = value;
    console.log(time_left);
  });

  let timer_stamp: Date = new Date(0);
  let timer_duration = 0;
  let interval: NodeJS.Timeout;

  // Subscribe to player state store
  player_state.subscribe((value: PlayerState) => {
    score = value.score;
    name = value.name;
    admin = value.admin;

    timer_stamp = value.timer_stamp;
    timer_duration = value.timer_duration;

    // Reset the interval when new values are received
    clearInterval(interval);
    if (timer_duration > 0) {
      interval = setInterval(updateTimer, 1000);
      time_left = timer_duration;
    }
  });

  // Start the timer update interval when the component mounts
  initializeStores();

  onMount(() => {});

  // Clean up the interval when the component is destroyed
  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<Toast />
<!-- App Shell -->
<div id="toolbar-wrap">
  <div id="toolbar">
    <!-- App Bar -->
    <AppBar
      gridColumns="grid-cols-3"
      slotDefault="place-self-center"
      slotTrail="place-content-end"
    >
      <svelte:fragment slot="lead">
        <strong class="text-xl uppercase">JG</strong>
      </svelte:fragment>
      <span class="text-xl flex flex-col justify-center items-center gap-0">
        {name}
        {#if admin}
          <span class="text-sm">[admin]</span>
        {/if}
      </span>

      <svelte:fragment slot="trail">
        <span class="text-xl flex flex-row items-center justify-center gap-2">
          {score}
          <img class="w-8 h-8" src={doubloon} alt="coin" />
        </span>
      </svelte:fragment>

      <!-- Countdown Bar -->
    </AppBar>
    {#if timer_duration > 0}
      <div class="w-screen bg-gray-200 h-2 col-span-3 bottom-0">
        <div
          class="bg-blue-500 h-full"
          style="width: {(100 * time_left) / timer_duration}%;
            transition: width 0.1s linear;"
        ></div>
      </div>
    {/if}
  </div>
</div>

<!-- Page Route Content -->
<div class="grow">
  <slot />
</div>

<footer class="footer footer-center" style="height: 60px;"></footer>
