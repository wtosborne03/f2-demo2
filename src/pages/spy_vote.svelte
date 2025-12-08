<script lang="ts">
    import { sendMessage } from "$lib/webSocketService";
    import { get } from "svelte/store";
    import type { PlayerState } from "../types/player_state";
    import type { SpyVoteData, VoteData } from "../types/page_data";
    import { player_state } from "../stores/player_state";
    import { gameClient } from "$lib/gameService";

    let m_data: SpyVoteData;
    m_data = get(player_state).pageData;

    function submit_answer(index: number) {
        gameClient.sendPlayerInput({
            payload: {
                $case: "playerVoteData",
                playerVoteData: {
                    answer: m_data.options[index],
                },
            },
        });
    }
</script>

<div class="container w-full block flex-col p-2 overflow-scroll">
    <div class="flex flex-col justify-center items-center">
        <div class="mb-2 p-4 text-center">Who do you think is the SPY?</div>
        {#each m_data.options as answer, index}
            <button
                style="width: 100%; font-size: 1.5rem; white-space: normal; word-wrap: break-word;"
                class="rounded-xl preset-filled m-2 p-2"
                on:click={() =>
                    submit_answer(m_data.options.findIndex((a) => a == answer))}
            >
                <div class="text-center text-sm">{m_data.option_by[index]}</div>
                {answer}
            </button>
        {/each}
    </div>
</div>
