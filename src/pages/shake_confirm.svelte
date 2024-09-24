<script lang="ts">
  import { sendMessage } from "$lib";
  import { onMount } from "svelte";
  const confirmMotion = () => {
    DeviceMotionEvent.requestPermission()
      .then((response) => {
        if (response == "granted") {
          confirm();
        }
      })
      .catch(console.error);
  };

  const confirm = () => {
    sendMessage({
      type: "game",
      data: {
        type: "confirm",
      },
    });
  };

  function checkMotionPermission() {
    return new Promise((resolve, reject) => {
      function handleMotion(event) {
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
