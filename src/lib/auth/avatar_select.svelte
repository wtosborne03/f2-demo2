<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import * as rive from "@rive-app/canvas";
  import { goto } from "$app/navigation";
  import { supabase } from "../../supabaseClient";
  import { authStore } from "$lib/stores/authStore";
  import { getToastStore } from "@skeletonlabs/skeleton";
  import { get } from "svelte/store";
  import { player_state } from "../../stores/player_state";
  import { sendMessage } from "$lib";
  import type { Avatar } from "../../types/player_state";

  let r: rive.Rive;
  let eyes_input: rive.StateMachineInput | undefined;
  let mouth_input: rive.StateMachineInput | undefined;
  let hair_input: rive.StateMachineInput | undefined;

  let toastStore = getToastStore();

  onMount(() => {
    r = new rive.Rive({
      src: "./avatar.riv",
      // OR the path to a discoverable and public Rive asset
      // src: '/public/example.riv',
      canvas: document.getElementById("canvas") as any,
      autoplay: true,
      stateMachines: "State Machine 1",
      onLoad: () => {
        r.resizeDrawingSurfaceToCanvas();
        const inputs = r.stateMachineInputs("State Machine 1");
        eyes_input = inputs.find((input) => input.name === "Eyes");
        mouth_input = inputs.find((input) => input.name === "Mouth");
        hair_input = inputs.find((input) => input.name === "Bodies");
        supabase
          .from("users")
          .select("*")
          .eq("id", $authStore.user?.id)
          .single()
          .then((res) => {
            console.log(res.data);
            eyes_value = res.data["avatar_eyes"] || 0;
            mouth_value = res.data["avatar_mouth"] || 0;
            hair_value = res.data["avatar_hair"] || 0;
            update();
          });
      },
    });
  });

  let eyes_value = 3;
  let mouth_value = 0;
  let hair_value = 0;

  const update = async () => {
    if (eyes_input) eyes_input.value = eyes_value;
    if (mouth_input) mouth_input.value = mouth_value;
    if (hair_input) hair_input.value = hair_value;
  };

  const saveAvatar = async () => {
    const { error } = await supabase
      .from("users")
      .update({
        avatar_eyes: eyes_value,
        avatar_mouth: mouth_value,
        avatar_hair: hair_value,
      })
      .eq("id", $authStore.user?.id);

    if (!error) {
      if (get(player_state).screen != "index") {
        const avatar: Avatar = {
          eyes: eyes_value || 0,
          hair: hair_value || 0,
          mouth: mouth_value || 0,
        };
        sendMessage({
          type: "avatar_update",
          data: {
            avatar: avatar,
          },
        });
      }
      toastStore.trigger({
        message: "Avatar saved!",
      });
    }
  };

  $: eyes_value, update();
  $: mouth_value, update();
  $: hair_value, update();

  onDestroy(() => {});
</script>

<div class="px-16 flex h-full flex-col justify-center items-center">
  <button class="btn variant-filled mb-10 mt-4" on:click={() => goto("/")}
    ><i class="fa-solid fa-arrow-left mr-2"></i>Back</button
  >

  <canvas id="canvas" width="100" height="100"></canvas>
  <div
    class="max-w-96 mt-4 text-start flex flex-col justify-center items-center"
  >
    <label
      class="label w-full flex flex-row justify-between items-center gap-3"
    >
      <span class="w-16">Eyes</span>
      <select class="select" bind:value={eyes_value}>
        <option value={3}>Normal Eyes</option>
        <option value={1}>Pretty Eyes</option>
        <option value={2}>Long Eyes</option>
        <option value={0}>Dead Eyes</option>
        <option value={4}>Robot Eyes</option>
      </select>
    </label>
    <label
      class="label w-full flex flex-row justify-between items-center gap-3"
    >
      <span class="w-16">Mouth</span>
      <select class="select" bind:value={mouth_value}>
        <option value={0}>Normal Mouth</option>
        <option value={1}>Happy</option>
        <option value={2}>John</option>
      </select>
    </label>
    <label
      class="label w-full flex flex-row justify-between items-center gap-3"
    >
      <span class="w-16">Hair</span>
      <select class="select" bind:value={hair_value}>
        <option value={0}>Hair 1</option>
        <option value={1}>Hair 2</option>
        <option value={2}>Hair 3</option>
        <option value={3}>Hair 4</option>
        <option value={4}>Hair 5</option>
        <option value={5}>Hair 6</option>
        <option value={6}>Hair 7</option>
      </select>
    </label>

    <button class="btn variant-filled-primary mt-8 mb-4" on:click={saveAvatar}
      >Save Avatar<i class="fa-solid fa-floppy-disk ml-2"></i></button
    >
  </div>
</div>
