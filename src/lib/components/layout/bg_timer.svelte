<script lang="ts">
  import { writable } from "svelte/store";
  import { player_state } from "../../../stores/player_state";
  import { getTime } from "$lib/gameService";
  import { onDestroy } from "svelte";

  $: timer_stamp = $player_state.timerStamp;
  $: timer_duration = $player_state.timerDuration;

  const remaining_time = writable(0);

  let interval: NodeJS.Timeout;

  const updateTimer = () => {
    remaining_time.update((current) => current - 0.5);
  };

  // Fetch the current time and set the remaining time
  // based on the timer stamp and duration
  const fetchTimer = async () => {
    clearInterval(interval);
    const t_time = await getTime();
    if (!timer_stamp) return;
    remaining_time.set((timer_stamp.getTime() - t_time) / 1000);
    interval = setInterval(updateTimer, 500);
  };

  $: if (timer_duration > 0) {
    fetchTimer();
  } else {
    clearInterval(interval);
  }

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
