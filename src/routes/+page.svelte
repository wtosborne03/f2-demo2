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
</script>

{#key $player_state.screen}
    <div
        id="main-background"
        class="p-4 flex flex-col min-h-screen h-screen pt-22"
        out:scale|local={{ duration: 300, easing: cubicOut }}
        in:scale|local={{ delay: 0, duration: 300, easing: cubicOut }}
    >
        <div class="flex flex-1 flex-col justify-center items-center">
            {#if $conn_store == false && getPlaying()}
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
