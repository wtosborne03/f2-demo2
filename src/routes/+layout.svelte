<script lang="ts">
  import { get, writable } from "svelte/store";
  import "../app.postcss";
  import {
    Toast,
    Drawer,
    Modal,
    getDrawerStore,
    initializeStores,
  } from "@skeletonlabs/skeleton";
  import type { PlayerState } from "../types/player_state";
  import "./toolbar.svelte";
  import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from "@floating-ui/dom";
  import { storePopup } from "@skeletonlabs/skeleton";
  import { player_state } from "../stores/player_state";
  import doubloon from "$lib/assets/icons/doubloon.png";
  import { onMount, onDestroy } from "svelte";
  import { supabase } from "../supabaseClient";
  import { drawerSettings } from "$lib/drawer";
  import AuthBox from "$lib/auth/auth_box.svelte";
  import { authStore } from "$lib/stores/authStore";
  import Spinner from "../components/spinner.svelte";

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  async function getCurrentTimestamp() {
    try {
      const response = await fetch(
        "https://timeapi.io/api/Time/current/zone?timeZone=UTC",
      );
      const data = await response.json();
      const currentTime = new Date(data.dateTime); // Time in UTC
      return currentTime.getTime();
    } catch (error) {
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
  const drawerStore = getDrawerStore();

  let loading = true;

  $: $authStore.loading, (loading = get(authStore).loading);

  // Clean up the interval when the component is destroyed
  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<Modal />
<Toast />
<Drawer>
  <AuthBox />
</Drawer>
<!-- App Shell -->
{#if $player_state.screen != "index"}
  <div class="z-20 block">
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
      on:click={() => {
        drawerStore.open(drawerSettings);
      }}
      class="z-20 mx-4 mt-4 rounded-xl flex flex-row justify-between p-4 hover:opacity-70 cursor-pointer"
      style="border-width: 3px; border-color: {color}; background-color: color(from {color} srgb r g b / 0.2);"
    >
      <!-- App Bar -->
      <div class="h-10 flex flex-col justify-center items-center">
        <i class="fa-solid fa-bars text-3xl" />
      </div>
      <span class="text-xl flex flex-col justify-center items-center gap-0">
        <div class="flex flex-col justify-center items-center h-10">
          {name}
          {#if admin}
            <span class="text-xs -mt-2">
              admin <strong class="text-lg uppercase -mt-1">👑</strong>
            </span>
          {/if}
        </div>
      </span>

      <span class="text-xl flex flex-row items-center justify-center gap-2">
        {score}
        <img class="w-8 h-8" src={doubloon} alt="coin" />
      </span>
    </div>
    {#if $player_state.team != ""}
      <div
        class="flex flex-row items-center text-lg font-semibold justify-between border-opacity-60 border-white p-2 h-10 border-b-2 mx-6"
      >
        <div class="opacity-60">Team:</div>
        <div>{$player_state.team}</div>
      </div>
    {/if}
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
  {#if loading}
    <div class="flex justify-center items-center h-full">
      <Spinner />
    </div>
  {:else}
    <slot />
  {/if}
</div>

<footer class="footer footer-center" style="height: 60px;"></footer>
