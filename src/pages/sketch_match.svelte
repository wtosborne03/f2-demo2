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

<div
    class="w-screen overflow-y-visible flex flex-col items-center p-0 m-0 sm:p-8 overflow-x-hidden"
>
    <div
        class="w-screen h-fit bg-white flex flex-col sm:w-full sm:max-w-lg rounded-3xl sm:shadow-2xl"
    >
        <div
            class="bg-linear-to-br from-[#ff6b6b] to-[#ff8e53] p-6 pb-4 text-center shadow-lg rounded-t-3xl shrink-0"
        >
            <div class="text-3xl animate-pulse inline-block">💕</div>
            <h1 class="text-2xl font-extrabold text-white drop-shadow-md">
                Create Your Profile
            </h1>
        </div>

        <form
            class="p-6 flex-1 flex flex-col gap-4 h-fit"
            on:submit|preventDefault={submit_prompt}
        >
            <div class="w-full">
                <input
                    class="w-full p-4 text-black border-2 border-gray-200 rounded-full text-base transition-all bg-gray-50 focus:outline-none focus:border-[#ff6b6b] focus:bg-white focus:ring-4 focus:ring-[#ff6b6b]/10 transform focus:scale-[1.02]"
                    type="text"
                    bind:value={name}
                    maxlength="20"
                    placeholder="Name"
                />
            </div>

            <div class="w-full">
                <div
                    class="flex items-center gap-4 bg-gray-50 border-2 border-gray-200 rounded-full px-5 transition-all focus-within:border-[#ff6b6b] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#ff6b6b]/10 focus-within:scale-[1.02]"
                >
                    <span
                        class="font-semibold text-gray-500 text-base whitespace-nowrap"
                        >Age</span
                    >
                    <input
                        class="border-none text-black bg-transparent py-4 flex-1 focus:ring-0 text-base outline-none"
                        type="number"
                        pattern="\d*"
                        max="1000"
                        placeholder="25"
                        bind:value={age}
                    />
                </div>
            </div>

            <div class="w-full">
                <input
                    class="w-full p-4 text-black border-2 border-gray-200 rounded-full text-base transition-all bg-gray-50 focus:outline-none focus:border-[#ff6b6b] focus:bg-white focus:ring-4 focus:ring-[#ff6b6b]/10 transform focus:scale-[1.02]"
                    type="text"
                    maxlength="30"
                    bind:value={job}
                    placeholder="Occupation"
                />
            </div>

            <div class="w-full">
                <textarea
                    class="w-full p-4 border-2 text-black border-gray-200 rounded-3xl text-base transition-all bg-gray-50 focus:outline-none focus:border-[#ff6b6b] focus:bg-white focus:ring-4 focus:ring-[#ff6b6b]/10 transform focus:scale-[1.02] resize-none font-sans"
                    maxlength="65"
                    bind:value={description}
                    placeholder="About you..."
                    rows="2"
                ></textarea>
            </div>

            <div class="mt-2 flex flex-col items-center px-7">
                <h2 class="text-xl font-bold text-gray-800 text-center mb-4">
                    ✨ Draw Your Portrait ✨
                </h2>

                <div
                    class="w-full max-w-sm rounded-3xl overflow-hidden shadow-xl mb-4 bg-white border-4 border-gray-400"
                >
                    <Canvas {color} {background} />
                </div>

                <div class="mb-6 flex justify-center">
                    <Palette
                        {paletteColor}
                        {colors}
                        {background}
                        on:color={({ detail }) => {
                            color = detail.color;
                        }}
                        on:clear={() => {
                            const canvas = document.getElementById(
                                "draw-canvas",
                            ) as HTMLCanvasElement;
                            const ctx = canvas?.getContext("2d");
                            if (ctx) {
                                ctx.clearRect(
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height,
                                );
                                ctx.fillStyle = "white";
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                            }
                        }}
                    />
                </div>
            </div>

            <button
                type="submit"
                class="w-full p-5 bg-gradient-to-br from-[#ff6b6b] to-[#ff8e53] text-white border-none rounded-full text-xl font-bold cursor-pointer flex items-center justify-center gap-3 shadow-lg shadow-[#ff6b6b]/40 transition-all hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-[#ff6b6b]/50 active:translate-y-0 active:scale-95 mb-4 shrink-0"
            >
                <span class="text-2xl animate-pulse">❤️</span>
                <span class="font-bold tracking-wide">Let's Match!</span>
                <span class="text-2xl animate-pulse">❤️</span>
            </button>
        </form>
    </div>
</div>
