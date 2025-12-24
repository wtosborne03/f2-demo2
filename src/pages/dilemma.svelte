<script lang="ts">
    import { gameClient } from "$lib/gameService";
    import goodMonkey from "$lib/assets/icons/goodMonkey.jpeg";
    import badMonkey from "$lib/assets/icons/evilMonkey.jpeg";
    import { player_state } from "../stores/player_state";
    import { derived } from "svelte/store";
    import { onMount } from "svelte";
    import Icon from "@iconify/svelte";

    // Derive points from the player state so the UI updates reactively
    const points = derived(player_state, ($p) => $p?.pageData?.points ?? 0);

    // Local UI state
    let choice: "keep" | "steal" | null = null;
    let disabled = false;
    let hintVisible = true;

    function sendChoice(answer: "keep" | "steal") {
        if (disabled) return;
        disabled = true;
        choice = answer;

        gameClient.sendPlayerInput({
            payload: {
                $case: "promptTextData",
                promptTextData: {
                    answer,
                },
            },
        });

        // Hide hint after selection
        hintVisible = false;
    }

    // Allow re-enabling for local dev if needed (no-op if server controls flow)
    onMount(() => {
        // keep hint visible briefly
        setTimeout(() => {
            hintVisible = false;
        }, 7000);
    });
</script>

<svelte:head>
    <!-- Use the playful font (if available in the project or fallback) -->
    <link
        href="https://fonts.googleapis.com/css2?family=DynaPuff:wght@400;700&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<div
    class="page-root w-full h-full relative flex flex-col justify-center items-center overflow-y-auto font-dynapuff"
>
    <main class="container mx-auto h-fit flex flex-col items-center justify-center px-6 py-3">
        <!-- Prompt Card -->

        <div class="w-full flex h-full flex-col md:flex-row items-stretch gap-4">
            <!-- SHARE card -->
            <button
                role="button"
                class="choice-card flex-1 relative bg-gradient-to-br from-green-600/20 to-blue-600/10 border-4 border-green-400/40 rounded-2xl transform-gpu transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
                on:click={() => sendChoice("keep")}
                aria-pressed={choice === "keep"}
                aria-disabled={disabled}
                class:disabled
            >
                <div class="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div class="inner-glow-left" />
                </div>

                <div class="relative z-10 flex flex-col items-center text-center">
                    <span class="flex flex-row justify-center items-center gap-6">
                        <div class="icon-bubble animate-wiggle text-yellow-400">
                            <Icon icon="dinkie-icons:banana" font-size="2rem" />
                        </div>
                        <h2 class="text-xl md:text-2xl font-bold text-green-100 drop-shadow-md">
                            SHARE
                        </h2>
                    </span>
                    <p class="mt-3 text-md md:text-lg text-white/90 leading-relaxed">
                        Keep a few bananas and sell them for
                        <span
                            class="ml-2 px-2 py-1 rounded-md bg-yellow-300 text-black font-semibold text-lg"
                            >{$points}</span
                        >
                        doubloons
                    </p>
                </div>

                {#if choice === "keep"}
                    <div class="choice-badge">Selected</div>
                {/if}
            </button>

            <!-- STEAL card -->
            <button
                role="button"
                class="choice-card flex-1 relative bg-gradient-to-br from-red-700/20 to-orange-600/10 border-4 border-red-400/40 rounded-2xl transform-gpu transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
                on:click={() => sendChoice("steal")}
                aria-pressed={choice === "steal"}
                aria-disabled={disabled}
            >
                <div class="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                    <div class="inner-glow-right" />
                </div>

                <div class="relative z-10 flex flex-col items-center text-center">
                    <span class="flex flex-row justify-center items-center gap-3">
                        <div class="icon-bubble animate-flip">
                            <Icon icon="dinkie-icons:dagger-knife" font-size="2rem" />
                        </div>
                        <h2 class="text-xl md:text-2xl font-bold text-red-100 drop-shadow-md">STEAL</h2>
                    </span>
                    <p class="mt-3 text-md md:text-lg text-white/90 leading-relaxed">
                        Steal them all for
                        <span
                            class="ml-2 px-2 py-1 rounded-md bg-yellow-300 text-black font-semibold text-lg"
                            >2000</span
                        >
                        doubloons — but beware the consequences.
                    </p>
                </div>

                {#if choice === "steal"}
                    <div class="choice-badge">Selected</div>
                {/if}
            </button>
        </div>

        <!-- Warning and hint -->
        <div class="mt-6 w-full flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div
                    class="warning-pill bg-yellow-800/60 text-yellow-200 px-4 py-2 rounded-full text-center font-semibold drop-shadow-md"
                >
                    ⚠️ Warning
                </div>
                <p class="text-white/80 max-w-2xl">
                    If more than one monkey steals, everyone loses — mutually assured destruction.
                </p>
            </div>
        </div>
    </main>
</div>

<style>
    :global(.font-dynapuff) {
        font-family:
            "DynaPuff",
            system-ui,
            -apple-system,
            "Segoe UI",
            Roboto,
            "Helvetica Neue",
            Arial;
    }

    .glow-left {
        width: 100%;
        height: 100%;
        background: radial-gradient(
            ellipse at center left,
            rgba(34, 197, 94, 0.18) 0%,
            rgba(59, 130, 246, 0.08) 30%,
            transparent 60%
        );
        filter: blur(60px);
        transform: translateX(-10%);
        animation: slow-pulse 6s ease-in-out infinite;
    }

    .glow-right {
        width: 100%;
        height: 100%;
        background: radial-gradient(
            ellipse at center right,
            rgba(239, 68, 68, 0.22) 0%,
            rgba(249, 115, 22, 0.08) 30%,
            transparent 60%
        );
        filter: blur(60px);
        transform: translateX(10%);
        animation: slow-pulse 5s ease-in-out infinite;
    }

    .choice-card {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }

    .choice-card .icon-bubble {
        width: 60px;
        height: 60px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02));
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.55);
    }

    .inner-glow-left {
        height: 60%;
        width: 60%;
        background: radial-gradient(circle at top left, rgba(34, 197, 94, 0.25), transparent 60%);
        filter: blur(36px);
        opacity: 0.9;
    }

    .inner-glow-right {
        height: 60%;
        width: 60%;
        background: radial-gradient(circle at top right, rgba(239, 68, 68, 0.25), transparent 60%);
        filter: blur(36px);
        opacity: 0.95;
    }

    .choice-badge {
        position: absolute;
        top: 14px;
        right: 14px;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        padding: 6px 10px;
        border-radius: 999px;
        font-weight: 600;
        transform: translateY(-6px);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6);
    }

    .warning-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }

    /* Animations */
    @keyframes slow-pulse {
        0% {
            transform: translateX(0) scale(1);
            opacity: 0.9;
        }
        50% {
            transform: translateX(2%) scale(1.03);
            opacity: 1;
        }
        100% {
            transform: translateX(0) scale(1);
            opacity: 0.9;
        }
    }

    @keyframes wiggle {
        0% {
            transform: rotate(-6deg) scale(1);
        }
        50% {
            transform: rotate(6deg) scale(1.06);
        }
        100% {
            transform: rotate(-6deg) scale(1);
        }
    }

    @keyframes flip {
        0% {
            transform: rotateY(0deg) scale(1);
        }
        50% {
            transform: rotateY(180deg) scale(1.05);
        }
        100% {
            transform: rotateY(0deg) scale(1);
        }
    }

    .animate-wiggle {
        animation: wiggle 2.4s ease-in-out infinite;
    }
    .animate-flip {
        animation: flip 3s ease-in-out infinite;
    }

    /* disabled visual */
    .disabled {
        opacity: 0.6;
        pointer-events: none;
    }

    @media (max-width: 768px) {
        .choice-card {
        }
        .icon-bubble {
            width: 60px;
            height: 60px;
        }
    }
</style>
