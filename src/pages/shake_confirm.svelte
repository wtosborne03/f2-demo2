<script lang="ts">
  import { sendMessage } from "$lib";
  const confirmMotion = () => {
    DeviceMotionEvent.requestPermission()
      .then((response) => {
        if (response == "granted") {
          window.addEventListener("devicemotion", (e) => {
            sendMessage({
              type: "game",
              data: {
                type: "confirm",
              },
            });
          });
        }
      })
      .catch(console.error);
  };
</script>

<div class="container h-full mx-auto flex justify-center items-center">
  <button class="btn variant-filled" on:click={confirmMotion}
    >Use Motion Controls</button
  >
</div>
