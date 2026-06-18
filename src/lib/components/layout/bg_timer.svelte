<script lang="ts">
  import { writable } from "svelte/store";
  import { onDestroy } from "svelte";
  import { gameState, serverTimeOffset } from "$lib/wsapi/gameClient";

  $: timer_stamp = $gameState.timer_stamp;
  $: timer_duration = $gameState.timer_duration;
  $: paused = $gameState.paused;

  const remaining_time = writable(0);

  let interval: NodeJS.Timeout;
  let fetching = false;
  let prev_timer_stamp: number | null = null;
  let prev_timer_duration = 0;
  let prev_paused = false;

  const updateTimer = () => {
    remaining_time.update((current) => Math.max(0, current - 0.5));
  };

  // Fetch the current time and set the remaining time
  // based on the timer stamp and duration
  const fetchTimer = async () => {
    // Avoid overlapping fetches
    if (fetching) return;
    fetching = true;
    try {
      clearInterval(interval);
      if (!timer_stamp) return;

      const parsedStamp = timer_stamp instanceof Date ? timer_stamp : new Date(timer_stamp);
      const stampMs = parsedStamp.getTime();
      if (isNaN(stampMs)) return;

      const t_time = Date.now() + $serverTimeOffset;
      const calculatedRemaining = (stampMs - t_time) / 1000;
      remaining_time.set(Math.max(0, calculatedRemaining));

      // Only count down if NOT paused
      if (!paused) {
        interval = setInterval(updateTimer, 500);
      }
    } finally {
      fetching = false;
    }
  };

  $: if (timer_duration > 0 && timer_stamp) {
    const parsedStamp = timer_stamp instanceof Date ? timer_stamp : new Date(timer_stamp);
    const stampMs = parsedStamp.getTime();
    if (!isNaN(stampMs)) {
      // Only fetch when the timer stamp, duration, or pause status changes
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
    clearInterval(interval);
    remaining_time.set(0);
  }

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class="w-screen h-screen fixed top-0 left-0 z-0 pointer-events-none opacity-15 overflow-hidden">
  <div
    class="timer-bar h-full text-white"
    class:critical={$remaining_time <= 10}
    style="width: {timer_duration > 0 ? ($remaining_time * (100 / timer_duration)) : 0}%;
          transition: width 0.5s linear;
          animation-play-state: {paused ? 'paused' : 'running'};"
  ></div>
</div>

<style>
  .timer-bar {
    background: repeating-linear-gradient(
      45deg,
      rgba(59, 130, 246, 0.25) 0px,
      rgba(59, 130, 246, 0.25) 25px,
      rgba(29, 78, 216, 0.45) 25px,
      rgba(29, 78, 216, 0.45) 50px
    );
    background-size: 71px 71px; /* (50px * sqrt(2)) ~ 70.71px */
    animation: scrollStripes 3s linear infinite;
  }

  @keyframes scrollStripes {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 71px 0;
    }
  }

  .timer-bar.critical {
    background: repeating-linear-gradient(
      45deg,
      rgba(239, 68, 68, 0.45) 0px,
      rgba(239, 68, 68, 0.45) 25px,
      rgba(185, 28, 28, 0.65) 25px,
      rgba(185, 28, 28, 0.65) 50px
    );
    animation: scrollStripes 1s linear infinite, flashRed 0.5s ease-in-out infinite alternate;
  }

  @keyframes flashRed {
    0% {
      filter: brightness(0.85);
    }
    100% {
      filter: brightness(1.25);
    }
  }
</style>
