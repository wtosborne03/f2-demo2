<script lang="ts">
    export let flipped = false;
    export let value = "";
    export let color = "";
    export let type = "";
    export let drinking = false;

    const flipCard = () => {
        flipped = !flipped;
    };
</script>

<div class="card-container perspective-1000">
    <div
        class="card-inner transform-style-3d transition-all duration-700 ease-out {flipped
            ? 'flipped'
            : ''}"
    >
        <!-- Front (face-up) -->
        <div
            class="card-face card-front"
            class:red-card={color === "red"}
            class:black-card={color === "black"}
        >
            <div class="card-content">
                <div class="top-corner">
                    <span
                        class="card-value"
                        style="color: {color === 'red' ? '#dc2626' : '#000'}"
                        >{value}</span
                    >
                    <span
                        class="card-suit"
                        style="color: {color === 'red' ? '#dc2626' : '#000'}"
                        >{type}</span
                    >
                </div>
                <span
                    class="center-suit"
                    style="color: {color === 'red' ? '#dc2626' : '#000'}"
                    >{type}</span
                >
                <div class="bottom-corner">
                    <span
                        class="card-value"
                        style="color: {color === 'red' ? '#dc2626' : '#000'}"
                        >{value}</span
                    >
                    <span
                        class="card-suit"
                        style="color: {color === 'red' ? '#dc2626' : '#000'}"
                        >{type}</span
                    >
                </div>
            </div>
        </div>

        <!-- Back (face-down) -->
        <div class="card-face card-back">
            <div class="card-pattern">
                {#if drinking}
                    <span class="beer-icon">🍺</span>
                {:else}
                    <span class="beer-icon"></span>
                {/if}
                <div class="pattern-grid">
                    {#each Array(12) as _, i}
                        <span class="pattern-dot"></span>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .card-container {
        width: 5rem;
        height: 6.5rem;
        perspective: 1000px;
    }

    @media (max-width: 380px) {
        .card-container {
            width: 120px;
            height: 170px;
        }
    }

    .card-inner {
        position: relative;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
    }

    .card-inner.flipped {
        transform: rotateY(180deg);
    }

    .card-face {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: 12px;
        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card-front {
        background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
        border: 3px solid #1f2937;
        transform: rotateY(180deg);
        animation: cardGlow 2s ease-in-out infinite;
    }

    .card-front.red-card {
        border-color: #dc2626;
    }

    .card-front.black-card {
        border-color: #000000;
    }

    @keyframes cardGlow {
        0%,
        100% {
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }
        50% {
            box-shadow:
                0 8px 24px rgba(0, 0, 0, 0.4),
                0 0 20px rgba(255, 255, 255, 0.2);
        }
    }

    .card-content {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 12px;
    }

    .top-corner {
        position: absolute;
        top: 8px;
        left: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1;
    }

    .bottom-corner {
        position: absolute;
        bottom: 8px;
        right: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1;
        transform: rotate(180deg);
    }

    .card-value {
        font-size: 1.1rem;
        font-weight: bold;
        font-family: serif;
    }

    .card-suit {
        font-size: 0.5rem;
        margin-top: 4px;
    }

    .center-suit {
        font-size: 2rem;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 0.9;
    }

    @media (max-width: 380px) {
        .card-value {
            font-size: 1.6rem;
        }
        .card-suit {
            font-size: 1.2rem;
        }
        .center-suit {
            font-size: 4rem;
        }
    }

    .card-back {
        background: linear-gradient(135deg, #4b5563 0%, #1f2937 100%);
        border: 3px solid #000;
    }

    .card-pattern {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .beer-icon {
        font-size: 4rem;
        opacity: 0.3;
        filter: blur(1px);
    }

    .pattern-grid {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(4, 1fr);
        padding: 16px;
        gap: 8px;
    }

    .pattern-dot {
        width: 8px;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        justify-self: center;
        align-self: center;
    }
</style>
