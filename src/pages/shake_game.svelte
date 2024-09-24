<script lang="ts">
  import { sendMessage } from "$lib";
  import { onMount } from "svelte";
  import { draggable } from "@neodrag/svelte";
  import type { DragEventData } from "@neodrag/svelte";

  function checkMotionPermission() {
    return new Promise((resolve, reject) => {
      function handleMotion(event: Event) {
        window.removeEventListener("devicemotion", handleMotion);
        resolve("granted");
      }

      window.addEventListener("devicemotion", handleMotion);

      // Set a timeout to handle the case where the event does not fire
      setTimeout(() => {
        window.removeEventListener("devicemotion", handleMotion);
        resolve("not-determined");
      }, 400); // Adjust the timeout as needed
    });
  }

  function checkMotion() {
    if (typeof DeviceMotionEvent !== "undefined") {
      checkMotionPermission().then((permissionState) => {
        if (permissionState === "granted") {
          return true;
        } else {
          return false;
        }
      });
    } else {
      return false;
    }
  }

  let motion = false;
  let initialPosition = { x: 0, y: 0 };
  let lastShakingDistance = 0;
  let totalShakingDistance = 0;

  onMount(() => {
    motion = checkMotion()!;
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
      🐥
    </div>
  {/if}
</div>
