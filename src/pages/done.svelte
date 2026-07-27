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

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 text-center space-y-6">
  <div class="card bg-base-200 border border-base-300 shadow-xl p-8 w-full">
    <h2 class="text-2xl font-black mb-3">Make your best case</h2>
    <p class="text-base text-base-content/80 mb-6 leading-relaxed">
      Give a strong argument for why other players should support your side. Be
      clear, concise, and persuasive — your words matter.
    </p>

    {#if isWebRTCSupported}
      <div class="mb-6 flex flex-col items-center">
        <button
          type="button"
          class="btn w-full flex items-center justify-center gap-2 font-bold py-3 text-base shadow-md transition-all duration-200 {isMicActive ? 'btn-error animate-pulse text-white' : 'btn-outline btn-accent'}"
          onclick={toggleMicrophone}
        >
          {#if isMicActive}
            <span class="text-xl">🎙️</span>
            <span>Microphone Amplified (Tap to Mute)</span>
          {:else}
            <span class="text-xl">🎤</span>
            <span>Amplify Voice via Mic</span>
          {/if}
        </button>
        {#if isMicActive}
          <span class="text-xs text-success mt-2 font-semibold flex items-center gap-1">
            <span class="inline-block w-2 h-2 rounded-full bg-success animate-ping"></span>
            Streaming live audio to main game screen
          </span>
        {/if}
        {#if micError}
          <span class="text-xs text-error mt-2 font-medium">{micError}</span>
        {/if}
      </div>
    {:else}
      <div class="mb-6 text-xs text-base-content/60 italic">
        Voice amplification unavailable (WebRTC not supported on connection)
      </div>
    {/if}

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
</div>
