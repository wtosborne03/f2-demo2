<script lang="ts">
  import { sendMessage } from "$lib";
  import { onDestroy, onMount } from "svelte";
  import JoystickController from "joystick-controller";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { BallData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  let color = get<PlayerState>(player_state).color;

  player_state.subscribe((value: PlayerState) => {
    color = value.color;
  });

  let joystickContainer: HTMLElement;
  const staticJoystick = new JoystickController(
    {
      maxRange: 90,
      level: 10,
      radius: 120,

      joystickRadius: 30,
      opacity: 0.5,
      leftToRight: false,
      bottomToUp: true,
      containerClass: `joystick-container rounded-full `,
      controllerClass: "joystick-controller",
      joystickClass: `joystick`,
      distortion: true,
      x: "50%",
      y: "50%",

      mouseClickButton: "ALL",
      hideContextMenu: false,
    },
    ({ x, y, leveledX, leveledY, distance, angle }) => {
      joystickData.x = x;
      joystickData.y = y;
    },
  );

  let guess = "";

  // Define the tick rate (e.g., 30 times per second)
  const TICK_RATE = 1000 / 30; // 30 Hz

  // Store the latest joystick data
  const joystickData = { x: 0, y: 0 };

  // Function to send the joystick data at the tick rate
  function sendJoystickData() {
    sendMessage({
      type: "game",
      data: {
        type: "control",
        x: joystickData.x,
        y: joystickData.y,
      },
    });
  }

  // Set interval to send joystick data at the tick rate
  const intervalId = setInterval(sendJoystickData, TICK_RATE);

  // Clear interval on component destroy
  onDestroy(() => {
    clearInterval(intervalId);
    staticJoystick.destroy();
  });
</script>

<div class="h-full w-full joy-bg fixed top-0 left-0">
  <div
    bind:this={joystickContainer}
    class=" w-60 h-60 opacity-100 border-8 fixed rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
    style="background-color: {color}; border-color: {$player_state.team ===
    'Black'
      ? 'black'
      : $player_state.team === 'White'
        ? 'white'
        : 'transparent'};"
  ></div>
</div>
