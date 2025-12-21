<script lang="ts">
    import { gameClient } from "$lib/gameService";
    import { sendMessage } from "$lib/webSocketService";

    let guess = "";

    function submit_prompt() {
        gameClient.sendPlayerInput({
            payload: {
                $case: "promptTextData",
                promptTextData: {
                    answer: guess,
                },
            },
        });
    }
</script>

<div
    class="container h-full mx-auto w-full flex flex-col justify-center items-center p-6"
>
    <div
        class="bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-3xl p-8 max-w-2xl w-full border-4 border-purple-500/30 shadow-2xl"
    >
        <div class="text-6xl mb-6">🎭</div>
        <h3 class="text-4xl font-bold mb-6 text-purple-300 text-center">
            What Did You See?
        </h3>
        <p class="text-xl text-gray-300 mb-8 text-center italic">
            Take your best guess at the performance!
        </p>
        <form class="flex flex-col justify-center items-center w-full">
            <div class="flex flex-row justify-start items-center w-full">
                <input
                    type="text"
                    class="textarea w-full text-xl p-4 rounded-xl bg-black/40 border-2 border-purple-400/50 text-white placeholder-gray-400"
                    maxlength="30"
                    placeholder="Type your guess here..."
                    bind:value={guess}
                />
            </div>
            <button
                style="font-size: 1.75rem;"
                class="btn preset-filled mt-8 px-8 py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-transform"
                on:click={submit_prompt}>🎯 Submit Guess</button
            >
        </form>
    </div>
</div>
