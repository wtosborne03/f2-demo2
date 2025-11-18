<script lang="ts">
  import { player_state } from "../../../stores/player_state";
  import { drawerSettings } from "$lib/config/drawer";
  import doubloon from "$lib/assets/icons/doubloon.png";
  import { sideBarOpen } from "../../../stores/sidebar";
  import Icon from "@iconify/svelte";

  $: name = $player_state.name;
  $: admin = $player_state.admin;
  $: score = $player_state.score;
  $: team = $player_state.team;
  $: color = $player_state.color;

  // const drawerStore = getDrawerStore();
</script>

<div class="z-20 block">
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    on:click={() => {
      sideBarOpen.set(true);
    }}
    class="z-20 mx-4 mt-4 rounded-xl flex flex-row justify-between p-4 hover:opacity-70 cursor-pointer"
    style="border-width: 3px; border-color: {color}; background-color: color(from {color} srgb r g b / 0.2);"
  >
    <!-- App Bar -->
    <div class="h-10 flex flex-col justify-center items-start w-20">
      <Icon icon="material-symbols:menu-rounded" font-size="3rem" />
    </div>
    <span class="text-xl flex flex-col justify-center items-center gap-0">
      <div class="flex flex-col justify-center items-center h-10">
        {name}
        {#if admin}
          <span class="text-xs -mt-2">
            admin <strong class="text-lg uppercase -mt-1">👑</strong>
          </span>
        {/if}
      </div>
    </span>

    <span
      class="text-xl flex flex-row items-center justify-center gap-2 w-20 h-10 pr-8"
    >
      <div class="text-center" style="padding-top: 3px;">
        {score.toString().padStart(5, "0")}
      </div>
      <img class="object-contain w-8 h-8" src={doubloon} alt="coin" />
    </span>
  </div>
  {#if team != ""}
    <div
      class="flex flex-row items-center text-lg font-semibold justify-between border-opacity-60 border-white p-2 h-10 border-b-2 mx-6"
    >
      <div class="opacity-60">Team:</div>
      <div class="font-bold" style:color={team}>
        {team}
      </div>
    </div>
  {/if}
</div>
