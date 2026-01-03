<script lang="ts">
  export const ssr = false; // Disable SSR for this component
  import type { SvelteComponent } from "svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { scale } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import Spinner from "$lib/components/spinner.svelte";
  import { browser } from "$app/environment";
  import { page } from "$app/state";
  import { onMount, onDestroy } from "svelte";
  import { apiClient } from "$lib/backend/axios";
  import { dbClient } from "../stores/apiClient";

  // Toggle this to enable automatic cycling through screens for debugging
  const debug = false;

  let paused = false;

  // Properly typed dynamic imports
  const screens: Record<string, any> = import.meta.glob("../pages/*.svelte");

  let Component: typeof SvelteComponent | null = null;

  async function loadComponent(): Promise<void> {
    const path = `../pages/${$gameState.screen}.svelte`;

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
      console.error(`Screen not found: ${$gameState.screen}`);
      Component = null;
    }
  }

  $: $gameState.screen, loadComponent(); // Auto-update when screen changes

  // Debug: automatically cycle through available screens every 10 seconds
  let cycleInterval: ReturnType<typeof setInterval> | null = null;

  const initApi = async () => {
    const client = await apiClient;
    dbClient.set(client);
  };

  onMount(() => {
    if (!browser) return;

    initApi();
    gameClient.connect(import.meta.env.VITE_PUBLIC_WS_API_URL);

    // if (debug) {
    //     // Build a list of screen names from the import keys.
    //     // Keys are like "../pages/name.svelte"
    //     const screenNames = Object.keys(screens)
    //         .map((p) => p.replace("../pages/", "").replace(".svelte", ""))
    //         .sort(); // sort to have deterministic order

    //     if (screenNames.length > 0) {
    //         // Determine starting index from current screen
    //         let idx = screenNames.indexOf(get(gameState)?.screen);
    //         if (idx === -1) idx = 0;

    //         // Advance every 3 seconds
    //         cycleInterval = setInterval(() => {
    //             if (!paused) {
    //                 idx = (idx + 1) % screenNames.length;
    //                 // Update the store's screen - this will trigger loadComponent via the reactive statement above
    //                 console.log(screenNames[idx], "screen changed");
    //                 player_state.update((s) => {
    //                     return {
    //                         ...s,
    //                         screen: screenNames[idx],
    //                     };
    //                 });
    //             }
    //         }, 3_000);
    //     } else {
    //         console.warn("Debug screen cycle enabled but no screens were found to cycle through.");
    //     }
    // }
  });

  const pauseScreenSwitch = () => {
    paused = !paused;
  };

  onDestroy(() => {
    if (cycleInterval) {
      clearInterval(cycleInterval);
      cycleInterval = null;
    }
  });
</script>

{#key $gameState.screen}
  <div
    id="main-background"
    class="flex flex-col p-4 grow flex-1 overflow-hidden"
  >
    <div
      in:scale|global={{ duration: 250, easing: cubicOut }}
      class={`flex flex-1 flex-col justify-center items-center ${page.url.pathname === "/" && $gameState.screen != "index" ? "pt-22 min-h-[calc(100vh-5.5rem)]" : ""}`}
    >
      {#if debug}
        <div class="fixed bottom-5 right-5">
          <button
            class="btn btn-primary"
            name="pauseScreenSwitch"
            on:click={() => pauseScreenSwitch()}
          >
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      {/if}
      {#if false}
        <div
          class="fixed w-screen stop-0 left-0 bg-black/50 z-50 flex flex-col justify-center items-center"
        >
          <div class="text-lg">Connecting...</div>
          <br />
          <div class="text-sm"><Spinner /></div>
        </div>
      {/if}

      <svelte:component this={Component} />
    </div>
  </div>
{/key}
