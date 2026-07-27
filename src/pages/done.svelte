<script lang="ts">
  import { onMount } from "svelte";
  import { gameClient } from "$lib/wsapi/gameClient";

  let submitting = false;
  let canSubmit = false;
  let countdown = 0;
  let isWebRTCSupported = false;
  let isMicActive = false;
  let micError = "";

  onMount(() => {
    canSubmit = false;
    countdown = 5;
    isWebRTCSupported = gameClient.isWebRTCSupported();

    const id = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        canSubmit = true;
        clearInterval(id);
      }
    }, 1000);

    return () => {
      clearInterval(id);
      if (isMicActive) {
        gameClient.stopAudioStream();
        isMicActive = false;
      }
    };
  });

  async function toggleMicrophone() {
    if (!isWebRTCSupported) return;
    micError = "";
    if (isMicActive) {
      gameClient.stopAudioStream();
      isMicActive = false;
    } else {
      const success = await gameClient.startAudioStream();
      if (success) {
        isMicActive = true;
      } else {
        isMicActive = false;
        micError = "Could not access microphone.";
      }
    }
  }

  async function confirm() {
    if (submitting || !canSubmit) return;
    submitting = true;
    try {
      if (isMicActive) {
        gameClient.stopAudioStream();
        isMicActive = false;
      }
      gameClient.sendPlayerInput("confirm");
    } finally {
      submitting = false;
    }
  }
</script>

<div
  class="relative flex flex-col justify-between items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center"
>
  <div
    class="card bg-base-200 border border-base-300 shadow-xl p-8 w-full my-auto"
  >
    <h2 class="text-2xl font-black mb-3">Make your best case</h2>
    <p class="text-base text-base-content/80 mb-8 leading-relaxed">
      Give a strong argument for why other players should support your side. Be
      clear, concise, and persuasive — your words matter.
    </p>

    <button
      type="button"
      class="btn btn-primary btn-lg w-full text-lg font-bold"
      onclick={confirm}
      disabled={submitting || !canSubmit}
    >
      {#if submitting}
        <span class="loading loading-spinner"></span>
        Sending...
      {:else}
        I'm Done {#if countdown > 0}({countdown}s){/if}
      {/if}
    </button>
  </div>

  {#if isWebRTCSupported}
    <div class="pb-10 flex flex-col items-center">
      <button
        type="button"
        class="btn btn-circle btn-lg transition-all duration-200 shadow-xl {isMicActive
          ? 'btn-error animate-pulse text-white scale-110'
          : 'btn-neutral bg-base-300 text-base-content/40 border-base-content/20'}"
        onclick={toggleMicrophone}
        aria-label={isMicActive ? "Mute microphone" : "Unmute microphone"}
      >
        {#if !isMicActive}
          <!-- Enabled Microphone Icon -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-16 h-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
            />
          </svg>
        {:else}
          <!-- Disabled Microphone Icon with Cross Through It -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-16 h-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"
              opacity="0.4"
            />
            <line
              x1="3"
              y1="3"
              x2="21"
              y2="21"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        {/if}
      </button>
      {#if micError}
        <span class="text-xs text-error mt-1 font-medium">{micError}</span>
      {/if}
    </div>
  {/if}
</div>
