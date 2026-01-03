<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import * as rive from "@rive-app/canvas";
  import { goto } from "$app/navigation";
  import { get } from "svelte/store";
  import { player_state } from "../../stores/player_state";
  import Spinner from "$lib/components/spinner.svelte";
  import Icon from "@iconify/svelte";
  import { toaster } from "$lib/util/toaster";
  import { apiClient } from "$lib/backend/axios";
  import type { Avatar } from "$lib/wsapi/game";
  import { gameClient } from "$lib/wsapi/gameClient";
  import { getHue, getSecondaryHue } from "$lib/util/color";
  import type { Paths } from "$lib/backend/api";

  let r: rive.Rive;
  let eyes_input: rive.StateMachineInput | undefined;
  let mouth_input: rive.StateMachineInput | undefined;
  let hair_input: rive.StateMachineInput | undefined;
  let emote_input: rive.StateMachineInput | undefined;
  let emote_fire_input: rive.StateMachineInput | undefined;

  let owned_items: Paths.GetUsersOwned.Responses.$200 = {};
  let loadedin = false;

  const categories: { [key: string]: string } = {
    0: "Eyes",
    1: "Hair",
    2: "Mouth",
    3: "Emote",
  };

  onMount(() => {
    rCanvas();
    r = new rive.Rive({
      src: import.meta.env.VITE_PUBLIC_API_URL + "/static/avatar/avatar.riv",
      canvas: document.getElementById("canvas") as any,
      autoplay: true,
      stateMachines: "State Machine 1",
      onLoad: async () => {
        r.resizeDrawingSurfaceToCanvas();
        const inputs = r.stateMachineInputs("State Machine 1");
        eyes_input = inputs.find((input) => input.name === "Eyes");
        mouth_input = inputs.find((input) => input.name === "Mouth");
        hair_input = inputs.find((input) => input.name === "Bodies");
        emote_input = inputs.find((input) => input.name === "emote");
        emote_fire_input = inputs.find((input) => input.name === "playEmote");
        const client = await apiClient;
        const { data } = await client!.getUsersMe();
        a_values["0"] = data.avatar_eyes || 0;
        a_values["2"] = data.avatar_mouth || 0;
        a_values["1"] = data.avatar_hair || 0;
        a_values["3"] = data.avatar_emote || 0;
        update();
        loadedin = true;

        const { data: ownedData } = await client!.getUsersOwned();
        owned_items = ownedData;
        console.log(ownedData);
      },
    });
  });

  let owned;
  let a_values: { [key: string]: number } = {
    "0": 3,
    "1": 0,
    "2": 0,
    "3": 0,
  };

  const update = async () => {
    if (eyes_input) eyes_input.value = a_values["0"];
    if (mouth_input) mouth_input.value = a_values["2"];
    if (hair_input) hair_input.value = a_values["1"];
    if (emote_input) emote_input.value = a_values["3"];
    if (loadedin) {
      saveAvatar();
    }
  };

  // Svelte action: add a quick pop animation on click
  const clickPop = (node: HTMLElement) => {
    const handler = () => {
      // add a class that triggers the keyframe, then remove it
      node.classList.add("pop-anim");
      window.setTimeout(() => node.classList.remove("pop-anim"), 260);
    };

    node.addEventListener("click", handler);
    return {
      destroy() {
        node.removeEventListener("click", handler);
      },
    };
  };

  const saveAvatar = async () => {
    const error = null;
    const client = await apiClient;
    try {
      await client!.putUsersAvatar(null, {
        avatar_eyes: a_values["0"],
        avatar_hair: a_values["1"],
        avatar_mouth: a_values["2"],
        avatar_emote: a_values["3"],
      });
      if (get(player_state).screen != "index") {
        const avatar: Avatar = {
          eyes: a_values["0"] || 0,
          hair: a_values["1"] || 0,
          mouth: a_values["2"] || 0,
          emote: a_values["3"] || 0,
        };
        gameClient.sendInput({
          type: "avatarUpdate",
          avatar: avatar,
        });
      }
    } catch (e) {}
  };

  $: a_values, update();

  onDestroy(() => {});

  const rCanvas = async () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    canvas.width = Math.max(window.innerWidth, window.innerHeight) / 5;
    canvas.height = canvas.width;
    await tick();
  };
</script>

<div
  class="h-screen overflow-y-auto bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 text-white"
>
  <!-- Header -->
  <header
    class="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/20"
  >
    <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <button class="btn preset-filled w-14" on:click={() => goto("/")}>
        <Icon icon="lets-icons:back" font-size="2rem" />
      </button>

      <h1 class="text-2xl font-bold text-white">Avatar</h1>

      <div class="w-14"></div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-2 pb-4">
    <div class="flex flex-col md:flex-row md:items-start gap-8">
      <!-- Avatar preview -->
      <div
        class="shrink-0 w-full md:w-1/3 rounded-xl p-1 flex flex-col items-center"
      >
        <div class="w-full flex justify-center">
          <canvas
            id="canvas"
            class="w-64 h-64 md:w-80 md:h-80 rounded-md"
            on:click={() => emote_fire_input?.fire()}
          ></canvas>
        </div>
        <div class="mt-4 text-sm text-gray-300 text-center">
          Tap to emote • Changes Saved Automatically <Icon
            icon="material-symbols:save"
            class="inline"
          />
        </div>
      </div>

      <!-- Items / categories -->
      <div class="flex-1">
        {#if loadedin}
          <div class="space-y-8">
            {#each Object.keys(owned_items) as category}
              <section>
                <div class="w-full flex items-center mb-4">
                  <h2 class="text-2xl font-semibold mr-4">
                    {categories[category]}
                  </h2>
                  <span class="flex-1 h-1 bg-slate-600 rounded"></span>
                </div>

                <div
                  class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-6 gap-4"
                >
                  {#each owned_items[category] || [] as item}
                    <!-- item card -->
                    <button
                      use:clickPop
                      class="rounded-lg p-2 aspect-square hover:brightness-105 cursor-pointer flex flex-col items-center justify-between text-center text-white transition-shadow shadow-md button-animate"
                      class:selected={a_values[category] == item.shop.value}
                      style={`background-color: ${getHue(item.shop.id)};` +
                        (a_values[category] == item.shop.value
                          ? ` box-shadow: 0 0 0 4px #f0f0f0, inset 0 1px 0 rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);`
                          : `border: 4px solid transparent;`)}
                      on:click={() => (a_values[category] = item.shop.value)}
                    >
                      <div class="text-md leading-6 text-gray-200">
                        {item.shop.name}
                      </div>
                      {#if a_values[category] == item.shop.value}
                        <Icon
                          icon="pixelarticons:checkbox"
                          color="#f0f0f0"
                          class="mt-2 text-xl"
                        />
                      {:else}
                        <Icon
                          icon="pixelarticons:checkbox-on"
                          color="#f0f0f0"
                          class="mt-2 text-xl"
                        />
                      {/if}
                    </button>
                  {/each}
                </div>
              </section>
            {/each}
          </div>
        {:else}
          <div
            class="w-full mt-6 flex flex-col justify-center items-center h-full"
          >
            <Spinner />
          </div>
        {/if}
      </div>
    </div>
  </main>
</div>

<style>
  /* Small scoped animations for avatar item buttons */
  .button-animate {
    transition:
      transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
      box-shadow 160ms ease;
    will-change: transform;
  }

  .button-animate:hover {
    transform: scale(1.03);
  }

  .button-animate:active {
    transform: scale(1);
  }

  /* stronger selected state (supplements inline style box-shadow) */
  .selected {
    transform: scale(1);
    box-shadow:
      0 10px 30px rgba(0, 0, 0, 0.45),
      0 0 0 6px rgba(255, 255, 255, 0.06) !important;
  }

  @keyframes pop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.08);
    }
    100% {
      transform: scale(1);
    }
  }

  .pop-anim {
    animation: pop 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
</style>
