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

  async function checkMotionPermissionStatus(): Promise<PermissionState> {
    return new Promise((resolve) => {
      const tempListener = (event: DeviceMotionEvent) => {
        window.removeEventListener("devicemotion", tempListener);
        resolve("granted");
      };
      window.addEventListener("devicemotion", tempListener);
      setTimeout(() => {
        window.removeEventListener("devicemotion", tempListener);
        resolve("denied");
      }, 100);
    });
  }

  function checkMotionControlsStatus(): boolean | "needs permission" {
    const supportsMotion = typeof DeviceMotionEvent !== "undefined";
    const supportsOrientation = typeof DeviceOrientationEvent !== "undefined";
    if (!supportsMotion && !supportsOrientation) {
      return false;
    }
    // Check if permission needs to be requested (iOS 13+)
    const needsMotionPermission =
      typeof (DeviceMotionEvent as any).requestPermission === "function";
    const needsOrientationPermission =
      typeof (DeviceOrientationEvent as any).requestPermission === "function";
    if (needsMotionPermission || needsOrientationPermission) {
      return "needs permission";
    }
    return true;
  }

  onMount(async () => {
    const status = checkMotionControlsStatus();
    if (status === "needs permission") {
      const granted = await checkMotionPermissionStatus();
      if (granted !== "granted") {
        showButton = true;
      } else {
        confirm();
      }
    } else {
      confirm();
    }
  });

  const confirmMotion = async () => {
    const motionPermission = await (
      DeviceMotionEvent as any
    ).requestPermission();
    confirm();
  };

  let showButton = false;
</script>

<div class="container h-full mx-auto flex justify-center items-center">
  Checking...
  {#if showButton}
    <button class="btn variant-filled" on:click={confirmMotion}
      >Use Motion Controls</button
    >
  {/if}
</div>
