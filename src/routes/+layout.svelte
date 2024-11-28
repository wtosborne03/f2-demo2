<script lang="ts">
  export const ssr = false;
  import { get, writable } from "svelte/store";
  import "../app.postcss";
  import {
    Toast,
    Drawer,
    Modal,
    getDrawerStore,
    initializeStores,
    getToastStore,
  } from "@skeletonlabs/skeleton";
  import type { PlayerState } from "../types/player_state";
  import "./toolbar.svelte";
  import { setup_script } from "$lib/index";
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
  import Spinner from "../components/spinner.svelte";
  import { getTime, sendMessage } from "$lib";

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  $: score = $player_state.score;
  $: name = $player_state.name;
  $: admin = $player_state.admin;
  $: screen = $player_state.screen;
  $: team = $player_state.team;
  $: timer_stamp = $player_state.timer_stamp;
  $: timer_duration = $player_state.timer_duration;
  $: color = $player_state.color;

  const remaining_time = writable(0); // Use a store for remaining_time

  let interval: NodeJS.Timeout;

  initializeStores();

  const toast = getToastStore();

  const updateTimer = () => {
    remaining_time.update((current) => current - 0.5);
  };

  const fetchTimer = async () => {
    clearInterval(interval);
    const t_time = await getTime();
    remaining_time.set((new Date(timer_stamp).getTime() - t_time) / 1000);
    interval = setInterval(updateTimer, 500);
  };

  $: if (timer_duration > 0) {
    fetchTimer();
  } else {
    clearInterval(interval);
  }

  onMount(() => {
    if ($player_state.screen == "index") {
      setup_script();
    }
    player_state.subscribe((value: PlayerState) => {
      console.log("screen: " + value.screen);
      toast.trigger({
        message: "screen: " + value.screen,
      });
    });
  });

  onDestroy(() => {
    clearInterval(interval);
    storePopup.set(null);
  });

  initializeStores();
  const drawerStore = getDrawerStore();

  let loading = false;
  onMount(() => {
    const report_error = (msg: string = "unknown error") => {
      toast.trigger({
        message: `Unhandled error: ${msg}`,
      });
    };

    const handle_rejection = (e: PromiseRejectionEvent) => {
      e.preventDefault();
      report_error(e?.reason);
    };

    const handle_error = (e: ErrorEvent) => {
      e.preventDefault();
      report_error(e?.message);
    };

    window.addEventListener("unhandledrejection", handle_rejection);
    window.addEventListener("error", handle_error);

    return () => {
      window.removeEventListener("unhandledrejection", handle_rejection);
      window.removeEventListener("error", handle_error);
    };
  });
</script>

<Modal />
<Toast />
<Drawer>
  <AuthBox />
</Drawer>
<!-- App Shell -->
{#if screen != "index"}
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
      <div class="h-10 flex flex-col justify-center items-start w-20">
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

      <span
        class="text-xl flex flex-row items-center justify-center gap-1 w-20 h-10"
      >
        <div class="text-center" style="padding-top: 3px;">
          {score.toString().padStart(5, "0")}
        </div>
        <img class="object-contain w-8 h-8" src={doubloon} alt="coin" />
      </span>
    </div>
    {#if team != ""}
      <div
        class="flex flex-row items-center text-lg font-semibold justify-between border-opacity-60 border-white p-2 h-10 border-b-2 mx-6"
      >
        <div class="opacity-60">Team:</div>
        <div class="font-bold" style:color={team}>
          {team}
        </div>
      </div>
    {/if}
  </div>
  {#if timer_duration > 0}
    <div class="w-screen h-screen fixed opacity-20 col-span-3 bottom-0 -z-10">
      <div
        class="bg-blue-500 h-full"
        style="width: {(100 * $remaining_time) / timer_duration}%;
            transition: width 0.5s linear;"
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
