<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let isStreaming = false;
  let videoEl: HTMLVideoElement | null = null;
  let earpieceAudioEl: HTMLAudioElement | null = null;
  let isEarpieceActive = false;
  let isCrewSpeaking = false;
  let crewSpeakingTimeout: any = null;
  let errorMessage = "";
  let taskSubmitted = false;
  let currentZoom = 1.0;

  onMount(() => {
    handleStartPerformerStream();

    const handleRemoteTrack = (data: { stream: MediaStream; track: MediaStreamTrack }) => {
      console.log("[Joker Performer] Received remote track from host/crew:", data);
      if (data.track.kind === "audio" || (data.stream && data.stream.getAudioTracks().length > 0)) {
        isEarpieceActive = true;
        isCrewSpeaking = true;
        if (earpieceAudioEl) {
          earpieceAudioEl.srcObject = data.stream;
          earpieceAudioEl.play().catch((err) => console.warn("[Joker Performer] Earpiece audio play error:", err));
        }

        if (crewSpeakingTimeout) clearTimeout(crewSpeakingTimeout);
        crewSpeakingTimeout = setTimeout(() => {
          isCrewSpeaking = false;
        }, 4000);
      }
    };

    gameClient.on("remoteTrack", handleRemoteTrack);

    if (gameClient.remoteStream) {
      isEarpieceActive = true;
      if (earpieceAudioEl) {
        earpieceAudioEl.srcObject = gameClient.remoteStream;
        earpieceAudioEl.play().catch(() => {});
      }
    }

    return () => {
      gameClient.off("remoteTrack", handleRemoteTrack);
      gameClient.stopVideoStream();
      if (crewSpeakingTimeout) clearTimeout(crewSpeakingTimeout);
    };
  });

  onDestroy(() => {
    gameClient.stopVideoStream();
  });

  let availableCameras: MediaDeviceInfo[] = [];

  async function handleStartPerformerStream() {
    errorMessage = "";
    const success = await gameClient.startVideoStream("environment"); // default to back camera
    if (success) {
      isStreaming = true;
      availableCameras = gameClient.availableVideoDevices;
      if (videoEl && gameClient.localStream) {
        videoEl.srcObject = gameClient.localStream;
      }
    } else {
      errorMessage = "Could not access camera. Please check permissions.";
    }
  }

  async function handleSelectSpecificCamera(deviceId: string) {
    const success = await gameClient.startVideoStream({ exact: deviceId });
    if (success && videoEl && gameClient.localStream) {
      videoEl.srcObject = gameClient.localStream;
    }
  }

  async function handleFlipCamera() {
    console.log("[Joker Performer UI] Flip camera clicked");
    const success = await gameClient.flipCamera();
    if (success && videoEl && gameClient.localStream) {
      videoEl.srcObject = gameClient.localStream;
    }
  }

  async function handleSetZoom(zoomFactor: number) {
    currentZoom = zoomFactor;
    console.log("[Joker Performer UI] Changing camera zoom to:", zoomFactor);
    await gameClient.setCameraZoom(zoomFactor);
    if (videoEl && gameClient.localStream && videoEl.srcObject !== gameClient.localStream) {
      videoEl.srcObject = gameClient.localStream;
    }
  }

  function handleTaskDone() {
    taskSubmitted = true;
    gameClient.sendPlayerInput("task_done");
  }
</script>

<!-- Hidden HTML5 Audio Element for Spectator Earpiece Audio -->
<audio bind:this={earpieceAudioEl} autoplay playsinline></audio>

<div class="joker-performer-container">
  <!-- Fullscreen Local Camera Video Preview (Behind App Bar & Bottom Card) -->
  <video
    bind:this={videoEl}
    autoplay
    playsinline
    muted
    class="fullscreen-camera-preview"
    style="transform: scaleX({gameClient.currentFacingMode === 'user'
      ? -1
      : 1}) {currentZoom > 1.0 ? `scale(${currentZoom})` : ''};"
  ></video>

  {#if !isStreaming}
    <div class="placeholder-overlay">
      <div class="cam-icon">📹</div>
      <p>Camera is currently off</p>
      {#if errorMessage}
        <p class="error">{errorMessage}</p>
      {/if}
      <button class="btn-start" on:click={handleStartPerformerStream}>
        Start HD Camera Stream
      </button>
    </div>
  {/if}

  <!-- Floating Header / App Bar -->
  <header class="appbar">
    <div class="badge-row">
      <span class="live-pill" class:active={isStreaming}>
        <span class="dot"></span>
        {isStreaming ? "JOKER (LIVE)" : "CONNECTING..."}
      </span>
      <span
        class="earpiece-pill"
        class:speaking={isCrewSpeaking}
        class:active={isEarpieceActive}
      >
        <span class="earpiece-icon">{isCrewSpeaking ? "🎙️" : "🎧"}</span>
        {isCrewSpeaking
          ? "CREW SPEAKING!"
          : isEarpieceActive
            ? "EARPIECE OK"
            : "EARPIECE READY"}
      </span>
    </div>

    {#if isStreaming}
      <div class="camera-controls-toolbar">
        <button type="button" class="btn-flip" on:click={handleFlipCamera}>
          🔄 Flip
        </button>

        {#if availableCameras.length > 2}
          <div class="camera-lens-selector">
            {#each availableCameras as cam, index}
              <button
                class="btn-lens {gameClient.activeDeviceId === cam.deviceId
                  ? 'active'
                  : ''}"
                on:click={() => handleSelectSpecificCamera(cam.deviceId)}
              >
                {cam.label || `Lens ${index + 1}`}
              </button>
            {/each}
          </div>
        {/if}

        <div class="zoom-controls-pill">
          <span class="zoom-icon">🔍</span>
          <button
            type="button"
            class="btn-zoom {currentZoom === 0.5 ? 'active' : ''}"
            on:click={() => handleSetZoom(0.5)}
          >
            0.5x
          </button>
          <button
            type="button"
            class="btn-zoom {currentZoom === 1.0 ? 'active' : ''}"
            on:click={() => handleSetZoom(1.0)}
          >
            1.0x
          </button>
          <button
            type="button"
            class="btn-zoom {currentZoom === 2.0 ? 'active' : ''}"
            on:click={() => handleSetZoom(2.0)}
          >
            2.0x
          </button>
        </div>
      </div>
    {/if}
  </header>

  <!-- Bottom Drawer Overlay: Assigned Dare Prompt & Action Button -->
  <main class="bottom-overlay">
    <div class="challenge-card">
      <div class="challenge-header">
        <span class="dare-label">YOUR DARE</span>
        <span class="challenge-title"
          >{$gameState.page_data?.challengeTitle || "THE JOKER DARE"}</span
        >
      </div>
      <p class="challenge-text">
        {$gameState.page_data?.challengeDescription ||
          "Carry out the assigned dare on camera!"}
      </p>
    </div>

    <button
      class="btn-done"
      class:submitted={taskSubmitted}
      on:click={handleTaskDone}
      disabled={taskSubmitted}
    >
      {taskSubmitted
        ? "DARE COMPLETED! WAITING FOR VOTES..."
        : "I FINISHED THE DARE! 👍"}
    </button>
  </main>
</div>

<style>
  .joker-performer-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    background: #001219;
    color: #ffffff;
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      sans-serif;
    overflow: hidden;
  }

  .fullscreen-camera-preview {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 1;
    transition: transform 0.2s ease;
  }

  .placeholder-overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 30, 60, 0.95);
    padding: 1.5rem;
    text-align: center;
  }

  .cam-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .btn-start {
    background: linear-gradient(135deg, #e63946, #d90429);
    color: white;
    border: 2px solid white;
    padding: 0.85rem 1.75rem;
    font-size: 1rem;
    font-weight: 900;
    border-radius: 0.75rem;
    cursor: pointer;
    margin-top: 1rem;
    box-shadow: 0 4px 15px rgba(230, 57, 70, 0.5);
  }

  .appbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: 20;
    padding: 0.75rem 0.75rem 1.5rem 0.75rem;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.85) 0%,
      rgba(0, 0, 0, 0.4) 65%,
      rgba(0, 0, 0, 0) 100%
    );
    pointer-events: none;
  }

  .badge-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    pointer-events: auto;
  }

  .live-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(0, 53, 102, 0.85);
    backdrop-filter: blur(8px);
    color: #90e0ef;
    padding: 0.3rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
    border: 1px solid rgba(144, 224, 239, 0.4);
  }

  .live-pill.active {
    background: #e63946;
    color: #ffffff;
    border-color: #ffffff;
    box-shadow: 0 0 12px rgba(230, 57, 70, 0.8);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  .earpiece-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(0, 53, 102, 0.85);
    backdrop-filter: blur(8px);
    color: #90e0ef;
    padding: 0.3rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
    border: 1px solid rgba(144, 224, 239, 0.4);
  }

  .earpiece-pill.active {
    border-color: #ffb703;
    color: #ffb703;
  }

  .earpiece-pill.speaking {
    background: #ffb703;
    color: #001219;
    border-color: #ffffff;
    box-shadow: 0 0 12px rgba(255, 183, 3, 0.9);
    animation: earpiecePulse 1s infinite alternate;
  }

  @keyframes earpiecePulse {
    0% {
      transform: scale(1);
    }
    100% {
      transform: scale(1.05);
    }
  }

  .camera-controls-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.6rem;
    pointer-events: auto;
  }

  .btn-flip {
    background: rgba(0, 30, 60, 0.85);
    backdrop-filter: blur(8px);
    color: #ffb703;
    border: 1.5px solid #ffb703;
    padding: 0.35rem 0.75rem;
    border-radius: 0.6rem;
    font-weight: 800;
    font-size: 0.8rem;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  }

  .zoom-controls-pill {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    background: rgba(0, 30, 60, 0.85);
    backdrop-filter: blur(8px);
    border: 1.5px solid #ffffff;
    border-radius: 0.6rem;
    padding: 0.2rem 0.35rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  }

  .zoom-icon {
    font-size: 0.75rem;
    margin-right: 0.1rem;
  }

  .btn-zoom {
    background: transparent;
    border: none;
    color: #90e0ef;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.2rem 0.4rem;
    border-radius: 0.4rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-zoom.active {
    background: #ffb703;
    color: #001219;
    font-weight: 900;
  }

  .bottom-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 20;
    padding: 1.5rem 1rem 1.25rem 1rem;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.95) 0%,
      rgba(0, 0, 0, 0.75) 70%,
      rgba(0, 0, 0, 0) 100%
    );
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .challenge-card {
    background: rgba(0, 30, 60, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-left: 5px solid #ffb703;
    border-radius: 0.85rem;
    padding: 0.85rem 1rem;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .challenge-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .dare-label {
    background: #ffb703;
    color: #001219;
    font-weight: 900;
    font-size: 0.7rem;
    padding: 0.15rem 0.45rem;
    border-radius: 0.3rem;
    letter-spacing: 0.05em;
  }

  .challenge-title {
    color: #ffb703;
    font-weight: 900;
    font-size: 0.9rem;
    letter-spacing: 0.03em;
  }

  .challenge-text {
    margin: 0;
    font-size: 1.15rem;
    line-height: 1.35;
    color: #ffffff;
    font-weight: 800;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  }

  .btn-done {
    width: 100%;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: 2px solid white;
    padding: 0.95rem;
    font-size: 1.15rem;
    font-weight: 900;
    border-radius: 0.85rem;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  .btn-done.submitted {
    background: #334155;
    box-shadow: none;
    color: #94a3b8;
    border-color: #475569;
  }
</style>
