<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { onMount } from "svelte";
  import { Button } from "m3-svelte";

  const confirm = () => {
    gameClient.sendInput({
      type: "confirm",
    });
  };

  async function checkMotionPermissionStatus(): Promise<PermissionState> {
    return new Promise((resolve) => {
      const tempListener = (event: DeviceMotionEvent) => {
        const hasData =
          (event.acceleration &&
            (event.acceleration.x !== null ||
              event.acceleration.y !== null ||
              event.acceleration.z !== null)) ||
          (event.accelerationIncludingGravity &&
            (event.accelerationIncludingGravity.x !== null ||
              event.accelerationIncludingGravity.y !== null ||
              event.accelerationIncludingGravity.z !== null)) ||
          (event.rotationRate &&
            (event.rotationRate.alpha !== null ||
              event.rotationRate.beta !== null ||
              event.rotationRate.gamma !== null));

        if (hasData) {
          window.removeEventListener("devicemotion", tempListener);
          resolve("granted");
        }
      };
      window.addEventListener("devicemotion", tempListener);
      setTimeout(() => {
        window.removeEventListener("devicemotion", tempListener);
        resolve("denied");
      }, 500);
    });
  }

  function checkMotionControlsStatus(): boolean | "needs permission" {
    const supportsMotion = typeof DeviceMotionEvent !== "undefined";
    const supportsOrientation = typeof DeviceOrientationEvent !== "undefined";
    if (!supportsMotion && !supportsOrientation) {
      return false;
    }
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

<div class="container h-full mx-auto flex justify-center items-center px-4">
  {#if showButton}
    <Button variant="filled" onclick={confirmMotion}>
      Use Motion Controls
    </Button>
  {/if}
</div>
