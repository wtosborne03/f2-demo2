<script lang="ts">
  import { get, writable } from "svelte/store";
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

  async function getCurrentTimestamp() {
    try {
      const response = await fetch(
        "https://timeapi.io/api/Time/current/zone?timeZone=UTC",
      );
      const data = await response.json();
      const currentTime = new Date(data.dateTime); // Time in UTC
      console.log("Current Timestamp:", currentTime.getTime()); // Timestamp in milliseconds
      return currentTime.getTime();
    } catch (error) {
      console.error("Error fetching time:", error);
      return 0;
    }
  }

  let score = 0;
  let name = "";
  let admin = false;

  const remaining_time = writable(0); // Use a store for remaining_time

  const updateTimer = async () => {
    remaining_time.set(
      (new Date(timer_stamp).getTime() - (await getCurrentTimestamp())) / 1000,
    );
  };
  let time_left = 0;

  remaining_time.subscribe((value) => {
    time_left = value;
    console.log(time_left);
  });

  let timer_stamp: Date = get(player_state).timer_stamp;
  let timer_duration = get(player_state).timer_duration;
  let interval: NodeJS.Timeout;
  onMount(() => {
    if (timer_duration > 0) {
      interval = setInterval(updateTimer, 1000);
      time_left = timer_duration;
    }
  });

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
