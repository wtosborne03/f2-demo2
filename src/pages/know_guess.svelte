<script lang="ts">
    import { sendMessage } from "$lib/webSocketService";
    import { get } from "svelte/store";
    import type { PlayerState } from "../types/player_state";
    import type { KnowData, PromptData } from "../types/page_data";
    import { player_state } from "../stores/player_state";
    import { gameClient } from "$lib/gameService";
    import Icon from "@iconify/svelte";

    let m_data: KnowData;
    m_data = get(player_state).pageData;

    let answer_text = "";

    function submit_prompt() {
        gameClient.sendPlayerInput({
            payload: {
                $case: "promptData",
                promptData: {
                    question: answer_text,
                },
            },
        });
    }
</script>

<div
    class="container h-full md:max-w-140 mx-auto w-full flex flex-col justify-center items-center"
>
    <form class="flex flex-col justify-center items-center w-full">
        <div
            class="mb-12 px-10 py-3 text-lg text-white/85 text-center preset-filled-secondary-300-700 rounded-2xl"
        >
            "{m_data.prompt}"
        </div>
        <div class="flex flex-row w-full justify-stretch items-center gap-2">
            <input
                class="input preset-filled-tertiary-100-900 w-full text-lg"
                type="text"
                maxlength="28"
                bind:value={answer_text}
                on:submit={submit_prompt}
            />
            <button
                class="btn preset-filled-tertiary-100-900 text-lg"
                on:click={submit_prompt}
                ><Icon icon="mingcute:send-fill" font-size="2.75rem" /></button
            >
        </div>
    </form>
</div>
