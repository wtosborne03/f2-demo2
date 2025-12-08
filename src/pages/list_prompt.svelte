<script lang="ts">
    import { sendMessage } from "$lib/webSocketService";
    import { get } from "svelte/store";
    import type { PlayerState } from "../types/player_state";
    import type { ListPromptData, PromptData } from "../types/page_data";
    import { player_state } from "../stores/player_state";
    import { gameClient } from "$lib/gameService";

    let m_data: ListPromptData;
    m_data = get(player_state).pageData;

    let survival_prompt = "";

    function submit_prompt() {
        gameClient.sendPlayerInput({
            payload: {
                $case: "promptTextData",
                promptTextData: {
                    answer: survival_prompt,
                },
            },
        });
    }
</script>

<div
    class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
    <aside class="alert preset-filled-warning-500 mb-4 text-2xl rounded-xl p-3">
        <!-- Icon -->
        <!-- Message -->
        <div class="alert-message">
            <h3 class="h3 text-lg text-center">
                If your scenario is survivable, you lose the round.
            </h3>
        </div>
        <!-- Actions -->
    </aside>
    <form class="flex flex-col justify-center items-center w-full">
        <div class="flex flex-row justify-start items-center w-full">
            <textarea
                class="textarea mt-2 w-full"
                placeholder="Survival Scenario"
                rows="4"
                maxlength="110"
                bind:value={survival_prompt}
            ></textarea>
        </div>
        <button class="btn preset-filled mt-4" on:click={submit_prompt}
            >Submit</button
        >
    </form>
</div>
