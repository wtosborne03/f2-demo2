<script lang="ts">
    import { sendMessage } from "$lib/webSocketService";
    import { get } from "svelte/store";
    import type { PlayerState } from "../types/player_state";
    import type { matchPerson, PromptData } from "../types/page_data";
    import { player_state } from "../stores/player_state";

    import Canvas from "../lib/components/canvas.svelte";
    import Palette from "$lib/components/palette.svelte";
    import { gameClient } from "$lib/gameService";

    const colors = [
        "#000000", // Black
        "#FFFFFF", // White
        "#FF6B6B", // Bright Red/Coral
        "#4ECDC4", // Teal/Cyan
        "#45B7D1", // Sky Blue
        "#FFA07A", // Light Salmon/Peach
        "#F7DC6F", // Sunny Yellow
    ];
    const background = "#fff";

    let color = colors[0];
    const paletteColor = color;

    let m_data: PromptData;
    m_data = get(player_state).pageData;

    let name = "";
    let age = 0;
    let job = "";
    let description = "";

    function submit_prompt() {
        const image = (
            document.getElementById("draw-canvas") as HTMLCanvasElement
        ).toDataURL("image/png");

        gameClient.sendPlayerInput({
            payload: {
                $case: "sketchProfile",
                sketchProfile: {
                    name: name,
                    age: age,
                    job: job,
                    description: description,
                    sketch: image,
                },
            },
        });
    }
</script>

<div class="app-container">
    <div class="card">
        <div class="card-header">
            <div class="logo-heart">💕</div>
            <h1 class="title">Create Your Profile</h1>
            <p class="subtitle">Make your sketch match!</p>
        </div>

        <form class="form" on:submit|preventDefault={submit_prompt}>
            <div class="">
                <input
                    class="input tinder-input"
                    type="text"
                    bind:value={name}
                    maxlength="20"
                    placeholder="Name"
                    required
                />
            </div>

            <div class="">
                <div class="age-input-wrapper">
                    <span class="age-label">Age</span>
                    <input
                        class="input age-input"
                        type="number"
                        pattern="\d*"
                        max="1000"
                        placeholder="25"
                        bind:value={age}
                        required
                    />
                </div>
            </div>

            <div class="">
                <input
                    class="input tinder-input"
                    type="text"
                    maxlength="30"
                    bind:value={job}
                    placeholder="Occupation"
                    required
                />
            </div>

            <div class="">
                <textarea
                    class="input tinder-input textarea"
                    maxlength="65"
                    bind:value={description}
                    placeholder="About you..."
                    required
                    rows="2"
                />
            </div>

            <div class="sketch-section">
                <h2 class="sketch-title">✨ Draw Your Portrait ✨</h2>

                <div class="canvas-wrapper">
                    <Canvas {color} {background} />
                </div>

                <div class="palette-wrapper">
                    <Palette
                        {paletteColor}
                        {colors}
                        {background}
                        on:color={({ detail }) => {
                            color = detail.color;
                        }}
                    />
                </div>
            </div>

            <button type="submit" class="submit-button">
                <span class="button-heart">❤️</span>
                <span class="button-text">Let's Match!</span>
                <span class="button-heart">❤️</span>
            </button>
        </form>
    </div>
</div>

<style>
    :global(body) {
        margin: 0;
        padding: 0;
        overflow-x: hidden;
    }

    .app-container {
        width: 100vw;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0;
        margin: 0;
    }

    .card {
        width: 100vw;
        background: white;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
    }

    .card-header {
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
        padding: 2rem 1.5rem 1.5rem;
        text-align: center;
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
    }

    .logo-heart {
        font-size: 3rem;
        animation: heartbeat 1.5s ease-in-out infinite;
        display: inline-block;
    }

    @keyframes heartbeat {
        0%,
        100% {
            transform: scale(1);
        }
        10%,
        30% {
            transform: scale(1.1);
        }
        20% {
            transform: scale(0.95);
        }
    }

    .title {
        font-size: 1.75rem;
        font-weight: 800;
        color: white;
        margin: 0.5rem 0 0.25rem;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
    }

    .subtitle {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.95);
        margin: 0;
        font-weight: 500;
    }

    .form {
        padding: 1.5rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .input-group {
        width: 100%;
    }

    .tinder-input {
        width: 100%;
        padding: 1rem 1.25rem;
        border: 2px solid #e0e0e0;
        border-radius: 50px;
        font-size: 1rem;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        background: #fafafa;
        box-sizing: border-box;
    }

    .tinder-input:focus {
        outline: none;
        border-color: #ff6b6b;
        background: white;
        box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
        transform: scale(1.02);
    }

    .textarea {
        border-radius: 1.5rem;
        resize: none;
        font-family: inherit;
    }

    .age-input-wrapper {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: #fafafa;
        border: 2px solid #e0e0e0;
        border-radius: 50px;
        padding: 0 1.25rem;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .age-input-wrapper:focus-within {
        border-color: #ff6b6b;
        background: white;
        box-shadow: 0 0 0 4px rgba(255, 107, 107, 0.1);
        transform: scale(1.02);
    }

    .age-label {
        font-weight: 600;
        color: #666;
        font-size: 1rem;
        white-space: nowrap;
    }

    .age-input {
        border: none;
        background: transparent;
        padding: 1rem 0;
        flex: 1;
    }

    .age-input:focus {
        box-shadow: none;
        transform: none;
        border: none;
    }

    .sketch-section {
        margin-top: 0.5rem;
    }

    .sketch-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #333;
        text-align: center;
        margin: 0 0 1rem;
    }

    .canvas-wrapper {
        width: 100%;
        border-radius: 1.5rem;
        overflow: hidden;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        margin-bottom: 1rem;
    }

    .canvas-wrapper :global(canvas) {
        width: 100%;
        height: auto;
        display: block;
    }

    .palette-wrapper {
        margin-bottom: 1.5rem;
    }

    .submit-button {
        width: 100%;
        padding: 1.25rem;
        background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
        color: white;
        border: none;
        border-radius: 50px;
        font-size: 1.25rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        margin-bottom: 1rem;
    }

    .submit-button:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 12px 35px rgba(255, 107, 107, 0.5);
    }

    .submit-button:active {
        transform: translateY(0) scale(0.98);
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
    }

    .button-heart {
        font-size: 1.5rem;
        animation: pulse 2s ease-in-out infinite;
        display: inline-block;
    }

    @keyframes pulse {
        0%,
        100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.2);
        }
    }

    .button-text {
        font-weight: 700;
        letter-spacing: 0.5px;
    }

    /* Tablet and up */
    @media (min-width: 640px) {
        .app-container {
            padding: 2rem;
        }

        .card {
            width: 100%;
            max-width: 480px;
            min-height: auto;
            border-radius: 2rem;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .card-header {
            border-radius: 2rem 2rem 0 0;
            padding: 2.5rem 2rem 2rem;
        }

        .form {
            padding: 2rem;
        }

        .title {
            font-size: 2rem;
        }
    }

    /* Desktop */
    @media (min-width: 1024px) {
        .card {
            max-width: 520px;
        }

        .submit-button:hover .button-heart {
            animation: heartbeat 0.5s ease-in-out;
        }
    }
</style>
