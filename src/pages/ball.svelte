<script lang="ts">
  import { sendMessage } from "$lib";
  import { onMount } from "svelte";
  import JoystickController from "joystick-controller";

  let joystickContainer: HTMLElement;
  const staticJoystick = new JoystickController(
    {
      maxRange: 70,
      level: 10,
      radius: 100,
      joystickRadius: 30,
      opacity: 0.5,
      leftToRight: false,
      bottomToUp: true,
      containerClass: "joystick-container",
      controllerClass: "joystick-controller",
      joystickClass: "joystick",
      distortion: true,
      x: "50%",
      y: "50%",
      mouseClickButton: "ALL",
      hideContextMenu: false,
    },
    ({ x, y, leveledX, leveledY, distance, angle }) => submit_control(x, y),
  );

  let guess = "";

  function submit_control(x: number, y: number) {
    sendMessage({
      type: "game",
      data: {
        type: "control",
        x: x,
        y: y,
      },
    });
  }
</script>

<div bind:this={joystickContainer} class="joystick-container"></div>

<style>
  .joystick-container {
    width: 200px;
    height: 100%; /* Adjust as needed */
    position: relative;
  }
</style>
