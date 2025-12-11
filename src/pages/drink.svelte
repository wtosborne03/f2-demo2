<script lang="ts">
    import Drink from "$lib/components/drink.svelte";
    import { get } from "svelte/store";
    import { player_state } from "../stores/player_state";
    import type { DrinkingPrompt } from "../types/page_data";

    const m_data = $player_state.pageData as DrinkingPrompt;

    import { sendMessage } from "$lib/webSocketService";
    import type { PlayerState } from "../types/player_state";
    import { gameClient } from "$lib/gameService";

    function confirm() {
        console.log("confirming");
        gameClient.sendPlayerInput({
            payload: {
                $case: "confirm",
                confirm: {},
            },
        });
    }
</script>

<Drink prompt={m_data.prompt} />

{#if get(player_state).isAdmin}
    <div class="flex mt-10 flex-col justify-center items-center text-center">
        <h3>Admin: Make sure that the players have completed their prompt.</h3>
        <button
            style=" font-size: 1.25rem;"
            class="btn preset-filled m-4 p-3"
            on:click={confirm}>They drank 👍</button
        >
    </div>
{/if}
