<script lang="ts">
    import { onMount } from "svelte";
    import { gameClient } from "$lib/gameService";
    let submitting = false;
    let canSubmit = false;
    let countdown = 0;

    onMount(() => {
        canSubmit = false;
        countdown = 5;
        const id = setInterval(() => {
            countdown -= 1;
            if (countdown <= 0) {
                canSubmit = true;
                clearInterval(id);
            }
        }, 1000);

        return () => clearInterval(id);
    });

    async function confirm() {
        if (submitting || !canSubmit) return;
        submitting = true;
        try {
            gameClient.sendPlayerInput({
                payload: {
                    $case: "confirm",
                    confirm: {},
                },
            });
        } finally {
            submitting = false;
        }
    }
</script>

<div
    class="container h-full mx-auto w-full flex flex-col justify-center items-center text-center px-4"
>
    <div class="max-w-xl bg-white/5 backdrop-blur-md rounded-lg p-8 shadow-md">
        <h2 class="text-2xl font-bold mb-2">Make your best case</h2>
        <p class="text-lg text-gray-100 mb-16">
            Give a strong argument for why other players should support your
            side. Be clear, concise, and persuasive — your words matter.
        </p>

        <button
            class="btn preset-filled-primary-500 m-2 p-4 w-full text-xl flex items-center justify-center gap-3"
            on:click={confirm}
            aria-label="Submit your argument and mark yourself done"
            disabled={submitting || !canSubmit}
        >
            {#if submitting}
                Sending...
            {:else}
                I'm Done<br />
                {#if countdown > 0}
                    ({countdown}s)
                {/if}
            {/if}
        </button>
    </div>
</div>
