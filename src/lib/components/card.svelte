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
        class="card-inner transform-style-3d {flipped ? 'flipped' : ''}"
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
                        style="color: {color === 'red' ? '#e11d48' : '#0f172a'}"
                        >{value}</span
                    >
                    <span
                        class="card-suit"
                        style="color: {color === 'red' ? '#e11d48' : '#0f172a'}"
                        >{type}</span
                    >
                </div>
                <div
                    class="center-suit"
                    style="color: {color === 'red' ? '#e11d48' : '#0f172a'}"
                    >{type}</div>
                <div class="bottom-corner">
                    <span
                        class="card-value"
                        style="color: {color === 'red' ? '#e11d48' : '#0f172a'}"
                        >{value}</span
                    >
                    <span
                        class="card-suit"
                        style="color: {color === 'red' ? '#e11d48' : '#0f172a'}"
                        >{type}</span
                    >
                </div>
            </div>
        </div>

        <!-- Back (face-down) -->
        <div class="card-face card-back">
            <div class="retro-card-back">
                <div class="card-frame">
                    <div class="card-pattern">
                        {#if drinking}
                            <span class="beer-icon">🍺</span>
                        {:else}
                            <span class="retro-star">★</span>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .card-container {
        width: 5.2rem;
        height: 7.2rem;
        perspective: 1000px;
    }

    @media (max-width: 380px) {
        .card-container {
            width: 4.6rem;
            height: 6.4rem;
        }
    }

    .card-inner {
        position: relative;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .card-inner.flipped {
        transform: rotateY(180deg);
    }

    .card-face {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        border-radius: 8px;
        box-shadow: 3px 3px 0px #000000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        box-sizing: border-box;
    }

    /* 90s Vintage Face-Up Card */
    .card-front {
        background: #fffdf5;
        border: 2.5px solid #000000;
        transform: rotateY(180deg);
    }

    .card-front.red-card {
        border-color: #000000;
    }

    .card-front.black-card {
        border-color: #000000;
    }

    .card-content {
        position: relative;
        width: 100%;
        height: 100%;
        padding: 6px;
        box-sizing: border-box;
    }

    .top-corner {
        position: absolute;
        top: 4px;
        left: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1;
    }

    .bottom-corner {
        position: absolute;
        bottom: 4px;
        right: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        line-height: 1;
        transform: rotate(180deg);
    }

    .card-value {
        font-size: 1.25rem;
        font-weight: 900;
        font-family: "Impact", "Arial Black", sans-serif;
        letter-spacing: -0.5px;
    }

    .card-suit {
        font-size: 0.85rem;
        margin-top: 1px;
    }

    .center-suit {
        font-size: 2.5rem;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        user-select: none;
        filter: drop-shadow(1px 1px 0px rgba(0, 0, 0, 0.15));
    }

    /* 90s Vintage Face-Down Card Back */
    .card-back {
        background: #1e1b4b;
        border: 2.5px solid #000000;
        padding: 4px;
    }

    .retro-card-back {
        width: 100%;
        height: 100%;
        border-radius: 4px;
        border: 1.5px solid #facc15;
        background: radial-gradient(circle, #312e81 0%, #1e1b4b 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
    }

    .card-frame {
        width: calc(100% - 6px);
        height: calc(100% - 6px);
        border: 1px dashed rgba(250, 204, 21, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card-pattern {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .retro-star {
        font-size: 1.8rem;
        color: #facc15;
        text-shadow: 0 0 6px rgba(250, 204, 21, 0.8), 2px 2px 0px #000;
        animation: pulseStar 2s ease-in-out infinite;
    }

    .beer-icon {
        font-size: 2rem;
        filter: drop-shadow(1px 1px 0 #000);
    }

    @keyframes pulseStar {
        0%, 100% {
            transform: scale(1);
            opacity: 0.9;
        }
        50% {
            transform: scale(1.15);
            opacity: 1;
        }
    }
</style>
