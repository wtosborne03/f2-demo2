<script lang="ts">
  import { sendMessage } from "$lib";
  import { onMount } from "svelte";
  import { draggable } from "@neodrag/svelte";
  import type { DragEventData } from "@neodrag/svelte";
  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import { get } from "svelte/store";

  let initialZ = 0;

  function checkMotionPermission() {
    return new Promise((resolve, reject) => {
      function handleMotion(event: DeviceMotionEvent) {
        if (event.acceleration?.z) {
          window.removeEventListener("devicemotion", handleMotion);
          initialZ = event.accelerationIncludingGravity?.z!;
          resolve("granted");
        } else {
          resolve("not-determined");
        }
      }

      window.addEventListener("devicemotion", handleMotion);

      // Set a timeout to handle the case where the event does not fire
      setTimeout(() => {
        window.removeEventListener("devicemotion", handleMotion);
        resolve("not-determined");
      }, 400); // Adjust the timeout as needed
    });
  }

  async function checkMotion() {
    console.log(typeof DeviceMotionEvent);
    if (typeof DeviceMotionEvent !== "undefined") {
      const permissionState = await checkMotionPermission();
      if (permissionState === "granted") {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  let motion = false;
  let initialPosition = { x: 0, y: 0 };
  let lastShakingDistance = 0;
  let totalShakingDistance = 0;

  onMount(() => {
    checkMotion().then((value) => {
      motion = value;
      if (motion) {
        window.addEventListener("devicemotion", handleMotion);
      }
    });
  });

  const sendProgress = (progress: number) => {
    sendMessage({
      type: "game",
      data: {
        type: "progress",
        data: progress,
      },
    });
  };

  function onDragStart(data: DragEventData) {
    initialPosition = { x: data.offsetX, y: data.offsetY };
  }

  function onDrag(data: DragEventData) {
    const currentPosition = { x: data.offsetX, y: data.offsetY };
    const distanceMoved = Math.sqrt(
      Math.pow(currentPosition.x - initialPosition.x, 2) +
        Math.pow(currentPosition.y - initialPosition.y, 2),
    );
    totalShakingDistance += distanceMoved;
    if (totalShakingDistance > lastShakingDistance + 2000) {
      lastShakingDistance = totalShakingDistance;
      sendProgress(totalShakingDistance);
    }
    initialPosition = currentPosition; // Update initial position to current position
  }

  function handleMotion(event: DeviceMotionEvent) {
    const acceleration = event.accelerationIncludingGravity;
    if (acceleration) {
      const distanceMoved = Math.sqrt(
        Math.pow(acceleration.x || 0, 2) + Math.pow(acceleration.y || 0, 2),
      );
      totalShakingDistance += distanceMoved;
      sendProgress(initialZ - (event.acceleration?.z || 0));
    }
  }
</script>

<div class="container h-full mx-auto flex flex-col justify-center items-center">
  {#if motion}
    Shake your device to play 🫨
  {:else}
    Drag the duck around to Shake it
    <div
      use:draggable={{
        axis: "y",
        bounds: "body",
        onDrag: onDrag,
        onDragStart: onDragStart,
      }}
      class="text-9xl"
    >
      <svg
        height="7rem"
        width="7rem"
        version="1.1"
        id="_x32_"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 512 512"
        xml:space="preserve"
      >
        <g>
          <path
            style:fill={`${get(player_state).color}`}
            class="st0"
            d="M442.973,250.491c-25.635,18.05-196.165,53.474-141.134-74.936c3.975-11.693,6.732-29.452,6.732-42.457
     c0-64.839-53.389-117.403-119.24-117.403c-50.361,0-93.398,30.764-110.867,74.224c-34.196,6.826-42.062-6.929-48.861-22.794
     C22.261,50.005,3.509,54.898,0.255,76.915c-2.288,15.462,10.727,57.347,44.004,70.52c-9.423,4.482-17.365,10.671-24.444,18.754
     c-9.507,10.877,2.654,29.198,16.147,24.566c12.733-4.37,32.433-6.001,45.419-6.358c5.814,13.109,13.09,24.398,19.972,33.568
     c7.351,9.799-3.319,16.916-25.936,53.812c-30.979,50.549-35.874,117.403,2.992,165.822
     c46.497,57.937,139.418,58.706,242.137,58.706c141.998,0,178.706-146.076,188.466-205.456
     C521.529,214.702,493.813,214.702,442.973,250.491z M153.119,131.945c-10.802,0-19.559-8.758-19.559-19.569
     c0-10.802,8.758-19.569,19.559-19.569c10.811,0,19.569,8.767,19.569,19.569C172.688,123.187,163.93,131.945,153.119,131.945z"
          />
        </g>
      </svg>
    </div>
  {/if}
</div>
