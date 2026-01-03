<script lang="ts">
  import { writable } from "svelte/store";
  import { onDestroy } from "svelte";
  import { gameState, serverTimeOffset } from "$lib/wsapi/gameClient";

  $: timer_stamp = $gameState.timer_stamp;
  $: timer_duration = $gameState.timer_duration;

  const remaining_time = writable(0);

  let interval: NodeJS.Timeout;
  let fetching = false;
  let prev_timer_stamp: Date | null = null;
  let prev_timer_duration = 0;

  const updateTimer = () => {
    remaining_time.update((current) => current - 0.5);
  };

  // Fetch the current time and set the remaining time
  // based on the timer stamp and duration
  const fetchTimer = async () => {
    // Avoid overlapping fetches
    if (fetching) return;
    fetching = true;
    try {
      clearInterval(interval);
      const t_time = Date.now() + $serverTimeOffset;
      if (!timer_stamp) return;
      remaining_time.set((timer_stamp.getTime() - t_time) / 1000);
      interval = setInterval(updateTimer, 500);
    } finally {
      fetching = false;
    }
  };

  $: if (timer_duration > 0) {
    // Only fetch when the timer stamp or duration changes
    const stampChanged =
      !!timer_stamp &&
      (!prev_timer_stamp ||
        timer_stamp.getTime() !== prev_timer_stamp.getTime());
    const durationChanged = timer_duration !== prev_timer_duration;
    if (stampChanged || durationChanged) {
      prev_timer_stamp = timer_stamp ?? null;
      prev_timer_duration = timer_duration;
      fetchTimer();
    }
  } else {
    prev_timer_stamp = null;
    prev_timer_duration = 0;
    clearInterval(interval);
  }

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class="w-screen h-screen fixed opacity-20 col-span-3 bottom-0 -z-10">
  <div
    class="bg-blue-500 h-full text-white"
    style="width: {$remaining_time * (100 / timer_duration)}%;
          transition: width 0.5s linear;"
  ></div>
</div>
