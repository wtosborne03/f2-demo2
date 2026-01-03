<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import JoystickController from "joystick-controller";
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let color = get(gameState).page_data;

  gameState.subscribe((value) => {
    color = value.color;
  });

  const joystickData = { x: 0, y: 0 };
  let previousJoystickData = { x: 0, y: 0 };

  let joystickContainer: HTMLElement;
  const staticJoystick = new JoystickController(
    {
      maxRange: 90,
      level: 10,
      radius: 120,

      joystickRadius: 40,
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

  const TICK_RATE = 1000 / 30;

  function sendJoystickData() {
    // Check if the joystick data has changed
    if (
      joystickData.x !== previousJoystickData.x ||
      joystickData.y !== previousJoystickData.y
    ) {
      gameClient.sendPlayerInput("joystickData", {
        x: joystickData.x,
        y: joystickData.y,
        isPressed: false,
      });
      // Update the previous joystick data
      previousJoystickData.x = joystickData.x;
      previousJoystickData.y = joystickData.y;
    }
  }

  const intervalId = setInterval(sendJoystickData, TICK_RATE);
  onDestroy(() => {
    clearInterval(intervalId);
    staticJoystick.destroy();
  });
</script>

<div class="h-full w-full joy-bg fixed top-0 left-0">
  <div
    bind:this={joystickContainer}
    class=" w-60 h-60 opacity-100 border-8 fixed rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
    style="background-color: {color}; border-color: {$gameState.team === 'Black'
      ? 'black'
      : $gameState.team === 'White'
        ? 'white'
        : 'transparent'};"
  ></div>
</div>
