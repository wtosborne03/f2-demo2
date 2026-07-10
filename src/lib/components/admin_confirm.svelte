<script lang="ts">
    import { gameState, gameClient } from "$lib/wsapi/gameClient";
    import { Button } from "m3-svelte";

    let {
        class: className = "",
        message = "Verify that everyone finished their drinking task before tapping to continue.",
        buttonText = "Everyone's Finished 👍",
    }: {
        class?: string;
        message?: string;
        buttonText?: string;
    } = $props();

    function confirm() {
        gameClient.sendPlayerInput("confirm");
    }
</script>

{#if $gameState.admin}
    <div
        class="admin-panel flex flex-col justify-center items-center text-center p-4 rounded-2xl bg-black/85 backdrop-blur-md border border-amber-500/40 shadow-2xl max-w-sm {className}"
    >
        <div class="mb-2 flex flex-col items-center gap-1">
            <span
                class="text-md font-black tracking-widest text-amber-400 uppercase bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20"
            >
                👑 Game Admin
            </span>
            <p class="text-md text-gray-300 mt-1 px-2">
                {message}
            </p>
        </div>
        <div class="btn-wrapper mt-2">
            <Button variant="filled" size="l" onclick={confirm}>
                {buttonText}
            </Button>
        </div>
    </div>
{/if}

<style>
    .admin-panel {
        animation: admin-pulse 3s infinite ease-in-out;
    }

    @keyframes admin-pulse {
        0%,
        100% {
            box-shadow:
                0 10px 25px -5px rgba(0, 0, 0, 0.5),
                0 0 0 0px rgba(245, 158, 11, 0.2);
        }
        50% {
            box-shadow:
                0 10px 25px -5px rgba(0, 0, 0, 0.5),
                0 0 12px 4px rgba(245, 158, 11, 0.4);
        }
    }

    .btn-wrapper {
        width: 100%;
    }
    .btn-wrapper > :global(*) {
        width: 100%;
        padding: 1rem 1.5rem;
        font-size: 1.1rem;
        font-weight: bold;
        background-color: #ff9100 !important; /* Slightly brighter amber for higher contrast on dark BG */
        color: #000000 !important; /* Black text for high readability over bright orange */
        border-radius: 12px !important;
    }
</style>
