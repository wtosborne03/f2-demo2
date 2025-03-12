<script lang="ts">
  export const ssr = false; // Disable SSR for this component
  import type { SvelteComponent } from "svelte";
  import { conn_store, websocketSetup } from "$lib/webSocketService";
  import { player_state } from "../stores/player_state";
  import { blur } from "svelte/transition";
  import Spinner from "$lib/components/spinner.svelte";
  import { browser } from "$app/environment";
  import { getToastStore } from "@skeletonlabs/skeleton";

  // Properly typed dynamic imports
  const screens: Record<string, any> = import.meta.glob("../pages/*.svelte");

  let Component: typeof SvelteComponent | null = null;
  const toastStore = getToastStore();

  async function loadComponent(): Promise<void> {
    const path = `../pages/${$player_state.screen}.svelte`;

    if (screens[path]) {
      const module = await screens[path]();

      // Handle cases where import might return another function
      if (typeof module === "function") {
        const nestedModule = await module();
        Component = nestedModule.default;
      } else {
        Component = module.default;
      }
    } else {
      console.error(`Screen not found: ${$player_state.screen}`);
      Component = null;
    }
  }

  $: $player_state.screen, loadComponent(); // Auto-update when screen changes
</script>

{#key $player_state.screen}
  <div
    id="main-background"
    class="w-full h-full p-3"
    out:blur|local={{ duration: 200 }}
    in:blur|local={{ delay: 200, duration: 200 }}
  >
    {#if $conn_store == false}
      <div
        class="fixed w-screen h-screen top-0 left-0 bg-black bg-opacity-50 z-50 flex flex-col justify-center items-center"
      >
        <div class="text-lg">Connecting...</div>
        <br />
        <div class="text-sm"><Spinner /></div>
      </div>
    {/if}

    <svelte:component this={Component} />
  </div>
{/key}
