<script lang="ts">
  import { writable } from "svelte/store";
  import { player_state } from "../../../stores/player_state";
  import { getTime } from "$lib/gameService";
  import { onDestroy } from "svelte";

  $: timer_stamp = $player_state.timerStamp;
  $: timer_duration = $player_state.timerDuration;

  const remaining_time = writable(0);

  let interval: NodeJS.Timeout;
  let fetched = false; // did we fetch the server time offset for the current running timer?
  let lastTimerStamp: number | null = null; // if the stamp changes, we should re-fetch offset

  const updateTimer = () => {
    remaining_time.update((current) => current - 0.5);
  };

  // Fetch the current time and set the remaining time
  // based on the timer stamp and duration
  const fetchTimer = async () => {
    clearInterval(interval);
    const t_time = await getTime();
    if (!timer_stamp) return false;
    remaining_time.set((timer_stamp.getTime() - t_time) / 1000);
    interval = setInterval(updateTimer, 500);
    return true;
  };

  // Fetch the current time offset once when the timer starts.
  // If the server restarts/updates the timer with a new stamp, re-fetch.
  $: (async () => {
    if (timer_duration > 0) {
      const stampMs = timer_stamp ? timer_stamp.getTime() : null;
      if (!fetched || (stampMs && lastTimerStamp !== stampMs)) {
        const didSet = await fetchTimer();
        if (didSet) {
          fetched = true;
          lastTimerStamp = stampMs;
        }
      }
    } else {
      // Timer not running: clear and reset fetched state
      clearInterval(interval);
      fetched = false;
      lastTimerStamp = null;
      remaining_time.set(0);
    }
  })();

  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div class="w-screen h-screen fixed opacity-20 col-span-3 bottom-0 -z-10">
  <div
    class="bg-blue-500 h-full"
    style="width: {(100 * $remaining_time) / timer_duration}%;
          transition: width 0.5s linear;"
  ></div>
</div>
