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
  let color: string;
  onMount(() => {
    if (timer_duration > 0) {
      interval = setInterval(updateTimer, 500);
      time_left = timer_duration;
    }
  });

  // Subscribe to player state store
  player_state.subscribe((value: PlayerState) => {
    score = value.score;
    name = value.name;
    admin = value.admin;
    color = value.color;

    const oldTimer = timer_duration;

    timer_stamp = value.timer_stamp;
    timer_duration = value.timer_duration;

    // Reset the interval when new values are received
    clearInterval(interval);
    if (oldTimer !== timer_duration) {
      interval = setInterval(updateTimer, 500);
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
{#if name != ""}
  <div class="z-20 block">
    <div
      class="z-20 mx-4 mt-4 rounded-xl flex flex-row justify-between p-4"
      style="border-width: 3px; border-color: {color}; background-color: color(from {color} srgb r g b / 0.2);"
    >
      <!-- App Bar -->
      <div class="h-10 flex flex-col justify-center items-center">
        {#if admin}
          <span class="text-md">[admin]</span>
          <strong class="text-xl uppercase -mt-1">👑</strong>
        {:else}
          <strong class="text-xl uppercase">👤</strong>
        {/if}
      </div>
      <span class="text-xl flex flex-col justify-center items-center gap-0">
        {name}
      </span>

      <span class="text-xl flex flex-row items-center justify-center gap-2">
        {score}
        <img class="w-8 h-8" src={doubloon} alt="coin" />
      </span>
    </div>
  </div>
  {#if timer_duration > 0}
    <div class="w-screen h-screen fixed opacity-20 col-span-3 bottom-0 -z-10">
      <div
        class="bg-blue-500 h-full"
        style="width: {(100 * time_left) / timer_duration}%;
            transition: width 0.1s linear;"
      ></div>
    </div>
  {/if}
{/if}

<!-- Page Route Content -->
<div class="grow">
  <slot />
</div>

<footer class="footer footer-center" style="height: 60px;"></footer>
