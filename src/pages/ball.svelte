<script lang="ts">
  import { sendMessage } from "$lib";
  import { onDestroy, onMount } from "svelte";
  import JoystickController from "joystick-controller";
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { BallData } from "../types/page_data";
  import { player_state } from "../stores/player_state";

  let m_data: BallData;
  m_data = get<PlayerState>(player_state).page_data;

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
  onDestroy(() => staticJoystick.destroy());
</script>

<div
  class="h-full w-full joy-bg fixed top-0 left-0"
  style:background-color={m_data.color}
>
  <div bind:this={joystickContainer} class="joystick-container"></div>
</div>
