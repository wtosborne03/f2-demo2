<script>
  import { fade } from "svelte/transition";
  import { joinRoom } from "$lib/index";
  import { browser } from "$app/environment";
  import logo from "$lib/assets/icons/logo.png";

  let roomCode = (browser && localStorage.getItem("code")) || "";
  let name = (browser && localStorage.getItem("name")) || "";
</script>

<div class="container h-full mx-auto flex justify-center items-center">
  <div class="space-y-10 text-center flex flex-col items-center">
    <!-- Animated Logo -->
    <figure class="flex flex-col items-center h-72">
      <section class="img-bg" />
      <img src={logo} alt="logo" class="object-contain h-full" />
    </figure>
    <!-- / -->

    <div class="space-y-2">
      <label class="label"
        ><span>Room Code</span>
        <input
          type="text"
          class="input"
          style="text-transform:uppercase"
          name="Room Code"
          maxlength="4"
          bind:value={roomCode}
        />
      </label>
      <label class="label"
        ><span>Name</span>
        <input
          type="text"
          class="input"
          maxlength="10"
          name="Name"
          bind:value={name}
        />
      </label>
      <button
        class="btn variant-filled"
        on:click={() => joinRoom(roomCode.toUpperCase(), name)}>Join</button
      >
    </div>
  </div>
</div>

<style lang="postcss">
  figure {
    @apply flex relative flex-col;
  }
  figure svg,
  .img-bg {
    @apply w-64 h-64 md:w-80 md:h-80;
  }
  .img-bg {
    @apply absolute z-[-1] rounded-full blur-[50px] transition-all;
    animation:
      pulse 5s cubic-bezier(0, 0, 0, 0.5) infinite,
      glow 5s linear infinite;
  }
  @keyframes glow {
    0% {
      @apply bg-primary-400/50;
    }
    33% {
      @apply bg-secondary-400/50;
    }
    66% {
      @apply bg-tertiary-400/50;
    }
    100% {
      @apply bg-primary-400/50;
    }
  }
  @keyframes pulse {
    50% {
      transform: scale(1.5);
    }
  }
</style>
