<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import JoystickController from "joystick-controller";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  const joystickData = { x: 0, y: 0 };
  let previousJoystickData = { x: 0, y: 0 };

  let joystickContainer: HTMLElement;
  let staticJoystick: any;
  let intervalId: any;

  onMount(() => {
    staticJoystick = new JoystickController(
      {
        maxRange: 90,
        level: 10,
        radius: 120,
        joystickRadius: 40,
        opacity: 0.5,
        leftToRight: false,
        bottomToUp: true,
        containerClass: "joystick-container rounded-full",
        controllerClass: "joystick-controller",
        joystickClass: "joystick",
        distortion: true,
        x: "50%",
        y: "50%",
        mouseClickButton: "ALL",
        hideContextMenu: false,
      },
      ({ x, y }) => {
        joystickData.x = x;
        joystickData.y = y;
      },
    );

    intervalId = setInterval(sendJoystickData, 1000 / 19);
  });

  function sendJoystickData() {
    if (
      joystickData.x !== previousJoystickData.x ||
      joystickData.y !== previousJoystickData.y
    ) {
      gameClient.sendPlayerInput("jd", {
        x: joystickData.x,
        y: joystickData.y,
        p: false,
      });
      previousJoystickData.x = joystickData.x;
      previousJoystickData.y = joystickData.y;
    }
  }

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
    if (staticJoystick) staticJoystick.destroy();
  });
</script>

<div class="h-full w-full joy-bg fixed top-0 left-0">
  <div
    bind:this={joystickContainer}
    class="w-60 h-60 opacity-100 border-8 fixed rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
    style="background-color: {$gameState.color}; border-color: {$gameState.team ===
    'Black'
      ? 'black'
      : $gameState.team === 'White'
        ? 'white'
        : 'transparent'};"
  ></div>
</div>
