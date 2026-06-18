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

<div class="w-screen h-screen fixed opacity-20 col-span-3 bottom-0 z-0 pointer-events-none">
  <div
    class="bg-blue-500 h-full text-white"
    style="width: {timer_duration > 0 ? ($remaining_time * (100 / timer_duration)) : 0}%;
          transition: width 0.5s linear;"
  ></div>
</div>
