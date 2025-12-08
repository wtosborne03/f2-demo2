<script lang="ts">
    import { sendMessage } from "$lib/webSocketService";
    import { get } from "svelte/store";
    import type { PlayerState } from "../types/player_state";
    import type { PromptData } from "../types/page_data";
    import { player_state } from "../stores/player_state";
    import { gameClient } from "$lib/gameService";

    let m_data: PromptData;
    m_data = get(player_state).pageData;

    let answer_text = "";

    function submit_prompt() {
        gameClient.sendPlayerInput({
            payload: {
                $case: "promptTextData",
                promptTextData: {
                    answer: answer_text,
                },
            },
        });
    }
</script>

<div
    class="container h-full mx-auto w-full flex flex-col justify-center items-center"
>
    <div class="text-center opacity-80">Are you the spy? You can't know!</div>
    <div class="mb-2 p-4 text-center">{m_data.question}</div>
    <form class="flex flex-col justify-center items-center">
        <input
            class="input w-full"
            type="text"
            maxlength="28"
            bind:value={answer_text}
            on:submit={submit_prompt}
        />
        <button class="btn preset-filled mt-12" on:click={submit_prompt}
            >Submit</button
        >
    </form>
</div>
