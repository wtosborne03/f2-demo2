<script lang="ts">
  import { writable } from "svelte/store";
  import { sideBarOpen } from "../../../stores/sidebar";
  import doubloon from "$lib/assets/icons/doubloon.png";
  import Icon from "@iconify/svelte";
  import { gameState, serverTimeOffset } from "$lib/wsapi/gameClient";
  import { onMount, onDestroy } from "svelte";
  import { getContrastColor } from "$lib/util/color";

  // reactive shortcuts to the store values
  $: name = $gameState.name;
  $: admin = $gameState.admin;
  $: score = $gameState.score;
  $: drinks = $gameState.drinks ?? 0;
  $: team = $gameState.team;
  $: color = $gameState.color;
  $: textColor = getContrastColor(color);

  // --- Timer state (moved from bg_timer) ---
  $: timer_stamp = $gameState.timer_stamp;
  $: timer_duration = $gameState.timer_duration;
  $: paused = $gameState.paused;

  const remaining_time = writable(0);

  let timerInterval: NodeJS.Timeout;
  let fetching = false;
  let prev_timer_stamp: number | null = null;
  let prev_timer_duration = 0;
  let prev_paused = false;

  const updateTimer = () => {
    remaining_time.update((current) => Math.max(0, current - 0.5));
  };

  const fetchTimer = async () => {
    if (fetching) return;
    fetching = true;
    try {
      clearInterval(timerInterval);
      if (!timer_stamp) return;

      const parsedStamp =
        timer_stamp instanceof Date ? timer_stamp : new Date(timer_stamp);
      const stampMs = parsedStamp.getTime();
      if (isNaN(stampMs)) return;

      const t_time = Date.now() + $serverTimeOffset;
      const calculatedRemaining = (stampMs - t_time) / 1000;
      remaining_time.set(Math.max(0, calculatedRemaining));

      if (!paused) {
        timerInterval = setInterval(updateTimer, 500);
      }
    } finally {
      fetching = false;
    }
  };

  $: if (timer_duration > 0 && timer_stamp) {
    const parsedStamp =
      timer_stamp instanceof Date ? timer_stamp : new Date(timer_stamp);
    const stampMs = parsedStamp.getTime();
    if (!isNaN(stampMs)) {
      const stampChanged = stampMs !== prev_timer_stamp;
      const durationChanged = timer_duration !== prev_timer_duration;
      const pausedChanged = !!paused !== prev_paused;
      if (stampChanged || durationChanged || pausedChanged) {
        prev_timer_stamp = stampMs;
        prev_timer_duration = timer_duration;
        prev_paused = !!paused;
        fetchTimer();
      }
    }
  } else {
    prev_timer_stamp = null;
    prev_timer_duration = 0;
    prev_paused = false;
    clearInterval(timerInterval);
    remaining_time.set(0);
  }

  $: timerPercent =
    timer_duration > 0 ? ($remaining_time * 100) / timer_duration : 0;
  $: critical = $remaining_time <= 10 && $remaining_time > 0;

  // --- Score flash state ---
  let flash = false;
  let prevScore = 0;
  let flashTimeout: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    prevScore = $gameState.score ?? 0;
  });

  onDestroy(() => {
    if (flashTimeout) clearTimeout(flashTimeout);
    clearInterval(timerInterval);
  });

  $: if (score !== undefined && score !== prevScore) {
    if (score > prevScore) {
      flash = true;
      if (flashTimeout) clearTimeout(flashTimeout);
      flashTimeout = setTimeout(() => {
        flash = false;
        flashTimeout = null;
      }, 700);
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
    class="app-bar-container z-20 mx-4 mt-4 rounded-xl flex flex-row justify-between items-center p-3 hover:opacity-80 cursor-pointer"
    class:flash
    style="--app-color: {color}; --timer-percent: {timerPercent}%; background-color: color(from {color} srgb r g b / 1.0); color: {textColor};"
  >
    <!-- Timer unfill bar (bottom of app bar) -->
    {#if timer_duration > 0 && $remaining_time > 0}
      <div
        class="timer-track"
        class:critical
        style="width: {timerPercent}%; animation-play-state: {paused
          ? 'paused'
          : 'running'};"
      ></div>
    {/if}

    <!-- App Bar -->
    <div class="h-10 flex flex-col justify-center items-start w-20 flex-none">
      <Icon icon="material-symbols:menu-rounded" font-size="3rem" />
    </div>

    <span class="text-xl flex flex-col justify-center items-center gap-0">
      <div class="flex flex-col justify-center items-center h-10">
        {name}
        {#if admin}
          <span class="text-sm opacity-70"> admin </span>
        {/if}
      </div>
    </span>

    <div
      class="text-xl flex flex-row items-center justify-end gap-2.5 md:gap-3.5 min-w-20 h-12 flex-none font-semibold"
    >
      {#if drinks > 0}
        <span
          class="flex flex-row items-center gap-1 drinks-counter"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>{drinks}</span>
          <span class="text-2xl md:text-3xl leading-none">🍺</span>
        </span>
      {/if}

      <span
        class="flex flex-row items-center gap-1 score"
        aria-live="polite"
        aria-atomic="true"
      >
        <span>{score}</span>
        <img
          class="object-contain w-8 h-8 md:w-10 md:h-10"
          src={doubloon}
          alt="coin"
        />
      </span>
    </div>
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
  /* App bar needs relative positioning so the timer track can be absolute inside it */
  .app-bar-container {
    position: relative;
    overflow: hidden;
  }

  /* Subtle unfilling timer bar at the bottom of the app bar */
  .timer-track {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 6px;
    border-radius: 0 2px 2px 0;
    background: rgba(255, 255, 255, 0.85);
    transition: width 0.5s linear;
    pointer-events: none;
    z-index: 1;
  }

  .timer-track.critical {
    height: 5px;
    background: rgba(239, 68, 68, 0.85);
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
    animation: pulse-critical 0.6s ease-in-out infinite alternate;
  }

  @keyframes pulse-critical {
    0% {
      opacity: 0.7;
    }
    100% {
      opacity: 1;
    }
  }

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
