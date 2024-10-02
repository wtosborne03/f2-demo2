<script lang="ts">
  import { sendMessage } from "$lib";
  import { onMount } from "svelte";

  const confirm = () => {
    sendMessage({
      type: "game",
      data: {
        type: "confirm",
      },
    });
  };

  function supportsMotionControls(): boolean {
    return "DeviceMotionEvent" in window;
  }

  async function hasMotionPermission(): Promise<boolean> {
    if (!supportsMotionControls()) {
      console.warn("Motion controls are not supported on this device.");
      return false;
    }

    // Check if the browser supports the permission API
    if ("permissions" in navigator) {
      try {
        const permissionStatus = await navigator.permissions.query({
          name: "accelerometer",
        } as PermissionDescriptor);
        if (permissionStatus.state === "granted") {
          return true;
        } else if (permissionStatus.state === "prompt") {
          // The user will be prompted to grant permission
          return new Promise((resolve) => {
            window.addEventListener("devicemotion", () => resolve(true), {
              once: true,
            });
          });
        } else {
          // Permission is denied
          return false;
        }
      } catch (error) {
        console.error("Error checking motion permission:", error);
        return false;
      }
    } else {
      // Fallback for browsers that do not support the permission API
      // Assume permission is granted if the event is available
      return true;
    }
  }

  onMount(() => {
    if (typeof DeviceMotionEvent !== "undefined") {
      checkMotionPermission().then((permissionState) => {
        if (permissionState === "granted") {
          confirm();
        } else {
          showButton = true;
        }
      });
    } else {
      confirm();
    }
  });

  let showButton = false;
</script>

<div class="container h-full mx-auto flex justify-center items-center">
  {#if showButton}
    <button class="btn variant-filled" on:click={confirmMotion}
      >Use Motion Controls</button
    >
  {/if}
</div>
