<script lang="ts">
  import { writable } from "svelte/store";
  import { sideBarOpen } from "../../../stores/sidebar";
  import doubloon from "$lib/assets/icons/doubloon.png";
  import Icon from "@iconify/svelte";
  import { gameState, serverTimeOffset } from "$lib/wsapi/gameClient";
  import { onMount, onDestroy } from "svelte";
  import { getContrastColor } from "$lib/util/color";
  import { isKeyboardVisible } from "$lib/stores/keyboard";

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

  import { authClient } from "../../../stores/authStore";
  import { browser } from "$app/environment";

  const session = authClient.useSession();

  onMount(() => {
    prevScore = $gameState.score ?? 0;
    if (browser && !$session.data?.user) {
      if (
        typeof (authClient as any).oneTap === "function" &&
        !(typeof window !== "undefined" && (window as any).CouchCupAndroid?.hasNativeGoogleOneTap?.())
      ) {
        (authClient as any).oneTap({ autoSelect: false }).catch(() => {});
      }
    }
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

<div
  class="app-bar-wrapper z-20 fixed w-full top-0"
  class:keyboard-hidden={$isKeyboardVisible}
>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    on:click={() => {
      sideBarOpen.set(true);
    }}
    class="app-bar-container z-20 mx-4 mt-3 rounded-none border-3 border-[#121212] shadow-[4px_4px_0px_#121212] flex flex-row justify-between items-center p-3 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#121212] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#121212] transition-all cursor-pointer font-headline"
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

    <!-- App Bar Menu -->
    <div class="h-10 flex flex-col justify-center items-start w-20 flex-none">
      <Icon icon="material-symbols:menu-rounded" font-size="2.75rem" />
    </div>

    <span class="text-xl flex flex-col justify-center items-center gap-0">
      <div class="flex flex-col justify-center items-center h-10 tracking-tight font-extrabold uppercase">
        {name}
        {#if admin}
          <span class="text-xs font-mono tracking-widest uppercase opacity-85"> admin </span>
        {/if}
      </div>
    </span>

    <div
      class="text-xl flex flex-row items-center justify-end gap-2.5 md:gap-3.5 min-w-20 h-12 flex-none font-bold"
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
        class="flex flex-row items-center gap-1 score font-headline"
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
      class="flex flex-row items-center text-sm font-bold uppercase tracking-wider justify-between bg-white text-black border-x-3 border-b-3 border-[#121212] px-4 py-1.5 shadow-[4px_4px_0px_#121212] mx-4"
    >
      <div class="opacity-80">TEAM:</div>
      <div class="font-extrabold" style:color={team}>
        {team}
      </div>
    </div>
  {/if}
</div>

<style>
  .app-bar-wrapper {
    transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.2, 1), opacity 0.22s ease;
    will-change: transform, opacity;
  }

  .app-bar-wrapper.keyboard-hidden {
    transform: translateY(-130%) !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  /* Never hide or animate the app bar on desktop devices */
  @media (hover: hover) and (pointer: fine) {
    .app-bar-wrapper.keyboard-hidden {
      transform: none !important;
      opacity: 1 !important;
      pointer-events: auto !important;
      transition: none !important;
    }
  }

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
    border-radius: 0;
    background: #ffffff;
    border-top: 2px solid #121212;
    transition: width 0.5s linear;
    pointer-events: none;
    z-index: 1;
  }

  .timer-track.critical {
    height: 7px;
    background: #d02020;
    animation: pulse-critical 0.4s ease-in-out infinite alternate;
  }

  @keyframes pulse-critical {
    0% {
      opacity: 0.6;
    }
    100% {
      opacity: 1;
    }
  }

  /* Container flash: scale */
  .flash {
    animation: appFlash 700ms cubic-bezier(0.2, 0.9, 0.2, 1);
  }

  @keyframes appFlash {
    0% {
      transform: scale(1);
    }
    35% {
      transform: scale(1.05);
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
