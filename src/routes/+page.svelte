<script lang="ts">
    export const ssr = false; // Disable SSR for this component
    import type { SvelteComponent } from "svelte";
    import { conn_store, websocketSetup } from "$lib/webSocketService";
    import { player_state } from "../stores/player_state";
    import { fly, fade, scale } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import Spinner from "$lib/components/spinner.svelte";
    import { browser } from "$app/environment";
    import { getPlaying } from "$lib/gameService";
    import { page } from "$app/state";
    import { onMount, onDestroy } from "svelte";
    import { get } from "svelte/store";
    $: screen = $player_state.screen;

    // Toggle this to enable automatic cycling through screens for debugging
    const debug = false;

    // Properly typed dynamic imports
    const screens: Record<string, any> = import.meta.glob("../pages/*.svelte");

    let Component: typeof SvelteComponent | null = null;

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

    $: ($player_state.screen, loadComponent()); // Auto-update when screen changes

    // Debug: automatically cycle through available screens every 10 seconds
    let cycleInterval: ReturnType<typeof setInterval> | null = null;

    onMount(() => {
        if (!browser) return;

        if (debug) {
            // Build a list of screen names from the import keys.
            // Keys are like "../pages/name.svelte"
            const screenNames = Object.keys(screens)
                .map((p) => p.replace("../pages/", "").replace(".svelte", ""))
                .sort(); // sort to have deterministic order

            if (screenNames.length > 0) {
                // Determine starting index from current screen
                let idx = screenNames.indexOf(get(player_state).screen);
                if (idx === -1) idx = 0;

                // Advance every 10 seconds
                cycleInterval = setInterval(() => {
                    idx = (idx + 1) % screenNames.length;
                    // Update the store's screen - this will trigger loadComponent via the reactive statement above
                    player_state.update((s) => {
                        return {
                            ...s,
                            screen: screenNames[idx],
                        };
                    });
                }, 6_000);
            } else {
                console.warn("Debug screen cycle enabled but no screens were found to cycle through.");
            }
        }
    });

    onDestroy(() => {
        if (cycleInterval) {
            clearInterval(cycleInterval);
            cycleInterval = null;
        }
    });
</script>

{#key $player_state.screen}
    <div id="main-background" class="flex flex-col p-4 grow flex-1 overflow-hidden">
        <div
            in:scale|global={{ duration: 250, easing: cubicOut }}
            class={`flex flex-1 flex-col justify-center items-center ${page.url.pathname === "/" && screen != "index" ? "pt-22 min-h-[calc(100vh-5.5rem)]" : ""}`}
        >
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
