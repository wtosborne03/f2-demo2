<script lang="ts">
  export const ssr = false;
  import "../app.css";
  import { onMount, onDestroy } from "svelte";
  import { player_state } from "../stores/player_state";
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
  import { Dialog, Portal, Toast } from "@skeletonlabs/skeleton-svelte";
  import AuthBox from "$lib/auth/auth_box.svelte";
  import Spinner from "$lib/components/spinner.svelte";
  import { setupErrorHandling } from "$lib/util/error_handling";
  import { browser } from "$app/environment";
  import { websocketSetup } from "$lib/webSocketService";
  import { toaster } from "$lib/util/toaster";
  import { authDialog } from "../stores/dialog";

  let dialogOpen = false;
  const unsubDialog = authDialog.subscribe((v) => (dialogOpen = v));

  //storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

  $: screen = $player_state.screen;
  $: timer_duration = $player_state.timer_duration;

  let loading = false;
  //let cleanupErrorHandling = setupErrorHandling();

  onMount(() => {
    if (browser) {
      websocketSetup();
    }
  });

  onDestroy(() => {
    unsubDialog();
    //storePopup.set(null);
    //cleanupErrorHandling?.();
  });
</script>

<Toast.Group {toaster}>
  {#snippet children(toast)}
    <Toast
      {toast}
      class="app-toast pointer-events-auto w-full max-w-sm md:max-w-md shadow-xl rounded-lg p-3 text-white flex items-start gap-3"
      style={`background-color: var(--color-${toast.type === "info" ? "secondary" : toast.type || "surface"}-950);
      border-color: var(--color-${toast.type === "info" ? "secondary" : toast.type || "surface"}-500);`}
    >
      <Toast.Message class="flex-1">
        <Toast.Title class="text-sm font-semibold">
          {toast.title}
        </Toast.Title>
        <Toast.Description class="text-xs mt-1">
          {toast.description}
        </Toast.Description>
      </Toast.Message>
      <Toast.CloseTrigger
        class="ml-2 focus:outline-none"
        style={`color: var(--color-${toast.type === "info" ? "secondary" : toast.type || "surface"}-600);`}
      />
    </Toast>
  {/snippet}
</Toast.Group>

<Dialog
  open={dialogOpen}
  onFocusOutside={() => authDialog.set(false)}
  onInteractOutside={() => authDialog.set(false)}
>
  <Portal>
    <Dialog.Backdrop
      class="fixed inset-0 z-50 bg-surface-50-950/50 transition transition-discrete opacity-0 starting:data-[state=open]:opacity-0 data-[state=open]:opacity-100 starting:data-[state=closed]:opacity-100 data-[state=closed]:opacity-0"
    />
    <Dialog.Positioner class="fixed inset-0 z-50 flex justify-start">
      <Dialog.Content
        class="h-screen card bg-surface-100-900 w-2/3 md:w-md space-y-4 shadow-xl transition transition-discrete opacity-0 -translate-x-full starting:data-[state=open]:opacity-0 starting:data-[state=open]:-translate-x-full data-[state=open]:opacity-100 data-[state=open]:translate-x-0 starting:data-[state=closed]:opacity-100 starting:data-[state=closed]:translate-x-0 data-[state=closed]:opacity-0 data-[state=closed]:-translate-x-full"
      >
        <AuthBox />
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>

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
