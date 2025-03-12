<script lang="ts">
  export const ssr = false;
  import "../app.postcss";
  import { onMount, onDestroy } from "svelte";
  import { player_state } from "../stores/player_state";
  import { getToastStore, initializeStores } from "@skeletonlabs/skeleton";
  import { storePopup } from "@skeletonlabs/skeleton";
  import {
    computePosition,
    autoUpdate,
    flip,
    shift,
    offset,
    arrow,
  } from "@floating-ui/dom";
  import AppBar from "$lib/components/layout/app_bar.svelte";
  import BgTimer from "$lib/components/layout/bg_timer.svelte";
  import Footer from "$lib/components/layout/footer.svelte";
  import { Modal, Toast, Drawer } from "@skeletonlabs/skeleton";
  import AuthBox from "$lib/auth/auth_box.svelte";
  import Spinner from "$lib/components/spinner.svelte";
  import { setupErrorHandling } from "$lib/util/error_handling";
  import { browser } from "$app/environment";
  import { websocketSetup } from "$lib/webSocketService";

  storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  $: screen = $player_state.screen;
  $: timer_duration = $player_state.timer_duration;

  initializeStores();

  let loading = false;
  //let cleanupErrorHandling = setupErrorHandling();
  const toastStore = getToastStore();

  onMount(() => {
    if (browser) {
      websocketSetup(toastStore);
    }
  });

  onDestroy(() => {
    storePopup.set(null);
    //cleanupErrorHandling?.();
  });
</script>

<Modal />
<Toast />
<Drawer>
  <AuthBox />
</Drawer>

{#if screen != "index"}
  <AppBar />
  {#if timer_duration > 0}
    <BgTimer />
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

<Footer />
