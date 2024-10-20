<script lang="ts">
  import { onDestroy, onMount, tick } from "svelte";
  import * as rive from "@rive-app/canvas";
  import { goto } from "$app/navigation";
  import { supabase } from "../../supabaseClient";
  import { authStore } from "$lib/stores/authStore";
  import { getToastStore } from "@skeletonlabs/skeleton";
  import { get } from "svelte/store";
  import { player_state } from "../../stores/player_state";
  import { sendMessage } from "$lib";
  import type { Avatar } from "../../types/player_state";
  import Spinner from "../../components/spinner.svelte";

  let r: rive.Rive;
  let eyes_input: rive.StateMachineInput | undefined;
  let mouth_input: rive.StateMachineInput | undefined;
  let hair_input: rive.StateMachineInput | undefined;
  let emote_input: rive.StateMachineInput | undefined;
  let emote_fire_input: rive.StateMachineInput | undefined;

  let toastStore = getToastStore();
  let owned_items: { [key: string]: any } = {};
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
      src: "./avatar.riv",
      canvas: document.getElementById("canvas") as any,
      autoplay: true,
      stateMachines: "State Machine 1",
      onLoad: () => {
        r.resizeDrawingSurfaceToCanvas();
        const inputs = r.stateMachineInputs("State Machine 1");
        eyes_input = inputs.find((input) => input.name === "Eyes");
        mouth_input = inputs.find((input) => input.name === "Mouth");
        hair_input = inputs.find((input) => input.name === "Bodies");
        emote_input = inputs.find((input) => input.name === "emote");
        emote_fire_input = inputs.find((input) => input.name === "playEmote");

        supabase
          .from("users")
          .select("*")
          .eq("id", $authStore.user?.id)
          .single()
          .then((res) => {
            a_values["0"] = res.data["avatar_eyes"] || 0;
            a_values["2"] = res.data["avatar_mouth"] || 0;
            a_values["1"] = res.data["avatar_hair"] || 0;
            a_values["3"] = res.data["avatar_emote"] || 0;
            update();
            loadedin = true;
          });

        supabase
          .from("owned")
          .select(
            `
    item_id,
    shop (
      id,
      name,
      type,
      value,
      description,
      thumbnail,
      price
    )
  `,
          )
          .eq("user_id", $authStore.user?.id)
          .then((res) => {
            if (!res.data) return;
            owned_items = res.data.reduce((acc: any, currentItem) => {
              const type = currentItem.shop.type;
              if (!acc[type]) {
                acc[type] = [];
              }
              acc[type].push(currentItem);
              return acc;
            }, {});
          });
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

  const saveAvatar = async () => {
    const { error } = await supabase
      .from("users")
      .update({
        avatar_eyes: a_values["0"],
        avatar_mouth: a_values["2"],
        avatar_hair: a_values["1"],
        avatar_emote: a_values["3"],
      })
      .eq("id", $authStore.user?.id);

    if (!error) {
      if (get(player_state).screen != "index") {
        const avatar: Avatar = {
          eyes: a_values["0"] || 0,
          hair: a_values["1"] || 0,
          mouth: a_values["2"] || 0,
          emote: a_values["3"] || 0,
        };
        sendMessage({
          type: "avatar_update",
          data: {
            avatar: avatar,
          },
        });
      }
    }
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
  class="flex flex-col items-center justify-start h-full px-4 sm:px-8 md:px-16"
>
  <button
    class="btn variant-filled mb-6 mt-4 w-full sm:w-auto"
    on:click={() => goto("/")}
  >
    <i class="fa-solid fa-arrow-left mr-2"></i>Back
  </button>
  <canvas
    id="canvas"
    class="w-full max-w-xs mx-auto -m-16 -mt-4"
    on:click={() => emote_fire_input?.fire()}
  ></canvas>
  {#if loadedin}
    <div class="w-full mt-6">
      {#each Object.keys(owned_items) as category}
        <div class="">
          <div class="w-full flex flex-row items-center">
            <span class="text-lg font-semibold mb-2 block"
              >{categories[category]}</span
            ><span class="w-full bg-slate-400 h-1 m-3"></span>
          </div>
          <div class="flex overflow-x-auto space-x-4">
            {#each owned_items[category] || [] as item}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div
                class={"flex-shrink-0 mb-6 p-2 w-20 h-20 rounded-md bg-slate-500 leading-5 bg-opacity-40 m-2 text-center text-white hover:bg-slate-600 hover:cursor-pointer flex flex-col justify-start items-center" +
                  (a_values[category] == item.shop.value
                    ? "p-0 border-4 border-white shadow-xl "
                    : "shadow-md")}
                on:click={() => {
                  a_values[category] = item.shop.value;
                }}
              >
                {item.shop.name}
                {#if a_values[category] == item.shop.value}
                  <i class="fa-solid fa-check" />
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="w-full mt-6 flex flex-col justify-center items-center h-full">
      <Spinner />
    </div>
  {/if}
</div>
