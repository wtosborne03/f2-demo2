<script lang="ts">
  import { player_state } from "../../../stores/player_state";
  import { sideBarOpen } from "../../../stores/sidebar";
  import doubloon from "$lib/assets/icons/doubloon.png";
  import Icon from "@iconify/svelte";
  import { onMount, onDestroy } from "svelte";

  // reactive shortcuts to the store values
  $: name = $player_state.name;
  $: admin = $player_state.isAdmin;
  $: score = $player_state.score;
  $: team = $player_state.team;
  $: color = $player_state.color;

  // flash state when score increases
  let flash = false;
  let prevScore = 0;
  let flashTimeout: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    // avoid flashing on initial mount
    prevScore = $player_state.score ?? 0;
  });

  onDestroy(() => {
    if (flashTimeout) clearTimeout(flashTimeout);
  });

  // watch for score changes and trigger a short flash if it increased
  $: if (score !== undefined && score !== prevScore) {
    if (score > prevScore) {
      flash = true;
      if (flashTimeout) clearTimeout(flashTimeout);
      flashTimeout = setTimeout(() => {
        flash = false;
        C;
        flashTimeout = null;
      }, 700); // keep in sync with CSS animation duration
    }
    prevScore = score;
  }
</script>

<div class="z-20 fixed w-full top-0">
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    on:click={() => {
      sideBarOpen.set(true);
    }}
    class="z-20 mx-4 mt-4 rounded-xl flex flex-row justify-between items-center p-3 hover:opacity-70 cursor-pointer"
    class:flash
    style="--app-color: {color}; border-width: 3px; border-color: {color}; background-color: color(from {color} srgb r g b / 0.2);"
  >
    <!-- App Bar -->
    <div class="h-10 flex flex-col justify-center items-start w-20 flex-none">
      <Icon icon="material-symbols:menu-rounded" font-size="3rem" />
    </div>

    <span class="text-xl flex flex-col justify-center items-center gap-0">
      <div class="flex flex-col justify-center items-center h-10">
        {name}
        {#if admin}
          <span class="text-xs -mt-2 opacity-50"> admin </span>
        {/if}
      </div>
    </span>

    <span
      class="text-xl flex flex-row items-center justify-end gap-2 w-20 h-12 flex-none score"
      aria-live="polite"
      aria-atomic="true"
    >
      {score}
      <img class="object-contain w-auto h-full" src={doubloon} alt="coin" />
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

<style>
  /* Container flash: gentle scale + glow */
  .flash {
    animation: appFlash 700ms cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  @keyframes appFlash {
    0% {
      transform: scale(1);
      box-shadow: none;
    }
    35% {
      transform: scale(1.06);
      box-shadow: 0 0 30px var(--app-color);
    }
    100% {
      transform: scale(1);
      box-shadow: none;
    }
  }

  /* Score-specific pop to draw attention to the number */
  .score {
    transition:
      transform 140ms ease,
      filter 140ms ease;
    will-change: transform, filter;
  }

  /* When the parent has .flash, animate the score separately for emphasis */
  .flash .score {
    animation: scorePop 700ms cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  @keyframes scorePop {
    0% {
      transform: translateY(0) scale(1);
      filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
    }
    30% {
      transform: translateY(-2px) scale(1.12);
      filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.08));
    }
    60% {
      transform: translateY(0) scale(1.04);
    }
    100% {
      transform: translateY(0) scale(1);
      filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
    }
  }

  /* Keep accessibility high contrast for focus/hover */
  .z-20.block :global(.hover\\:opacity-70):hover {
    opacity: 0.9;
  }
</style>
