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
  <header class="header">
    <div class="badge-row">
      <span class="live-pill" class:active={isStreaming}>
        <span class="dot"></span>
        {isStreaming ? "YOU ARE THE JOKER (HD LIVE)" : "CONNECTING..."}
      </span>
      <span class="earpiece-pill" class:speaking={isCrewSpeaking} class:active={isEarpieceActive}>
        <span class="earpiece-icon">{isCrewSpeaking ? "🎙️" : "🎧"}</span>
        {isCrewSpeaking ? "CREW SPEAKING IN EARPIECE!" : isEarpieceActive ? "EARPIECE CONNECTED" : "EARPIECE READY"}
      </span>
    </div>
    <h2>{$gameState.page_data?.challengeTitle || "THE JOKER DARE"}</h2>
  </header>

  <!-- Local Camera Preview -->
  <main class="preview-area">
    <div class="video-wrapper">
      <video
        bind:this={videoEl}
        autoplay
        playsinline
        muted
        class="camera-preview"
        style="transform: scaleX({gameClient.currentFacingMode === 'user'
          ? -1
          : 1}) {currentZoom > 1.0 ? `scale(${currentZoom})` : ''};"
      ></video>

      {#if isStreaming}
        <div class="camera-controls-bar">
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

          <!-- 0.5x / 1.0x / 2.0x Zoom Control Buttons -->
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
    </div>

    <!-- Challenge Instructions -->
    <div class="challenge-box">
      <h3>YOUR ASSIGNED DARE:</h3>
      <p>
        {$gameState.page_data?.challengeDescription ||
          "Carry out the assigned dare on camera!"}
      </p>
    </div>
  </main>

  <footer class="footer-section">
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
  </footer>
</div>

<style>
  .joker-performer-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background: #0077b6;
    color: #ffffff;
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      sans-serif;
    padding: 1rem;
    box-sizing: border-box;
  }

  .header {
    text-align: center;
    margin-bottom: 0.75rem;
  }

  .badge-row {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .live-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #003566;
    color: #90e0ef;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
  }

  .live-pill.active {
    background: #e63946;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(230, 57, 70, 0.6);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  h2 {
    font-size: 1.3rem;
    margin: 0;
    color: #ffb703;
    font-weight: 900;
    text-shadow: 2px 2px 0px #000;
  }

  .preview-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .video-wrapper {
    position: relative;
    width: 100%;
    height: 250px;
    border-radius: 1rem;
    overflow: hidden;
    background: #001219;
    border: 4px solid #ffb703;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  }

  .camera-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease;
  }

  .placeholder-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0, 53, 102, 0.95);
    padding: 1rem;
  }

  .btn-start {
    background: linear-gradient(135deg, #e63946, #d90429);
    color: white;
    border: 2px solid white;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 900;
    border-radius: 0.75rem;
    cursor: pointer;
  }

  .camera-controls-bar {
    position: absolute;
    top: 0.6rem;
    left: 0.6rem;
    right: 0.6rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10;
    pointer-events: auto;
  }

  .btn-flip {
    background: rgba(0, 53, 102, 0.9);
    backdrop-filter: blur(6px);
    color: #ffb703;
    border: 2px solid #ffb703;
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
    gap: 0.25rem;
    background: rgba(0, 30, 60, 0.9);
    backdrop-filter: blur(6px);
    border: 2px solid #ffffff;
    border-radius: 0.6rem;
    padding: 0.25rem 0.4rem;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  }

  .zoom-icon {
    font-size: 0.75rem;
  }

  .btn-zoom {
    background: transparent;
    border: none;
    color: #90e0ef;
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.2rem 0.45rem;
    border-radius: 0.4rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-zoom.active {
    background: #ffb703;
    color: #001219;
    font-weight: 900;
  }

  .challenge-box {
    background: #003566;
    border-left: 6px solid #ffb703;
    border-radius: 0.75rem;
    padding: 1rem;
  }

  .challenge-box h3 {
    margin: 0 0 0.4rem 0;
    font-size: 0.9rem;
    color: #ffb703;
    letter-spacing: 0.05em;
    font-weight: 900;
  }

  .challenge-box p {
    margin: 0;
    font-size: 1.1rem;
    line-height: 1.4;
    color: #ffffff;
    font-weight: 700;
  }

  .footer-section {
    margin-top: 1rem;
  }

  .btn-done {
    width: 100%;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: 2px solid white;
    padding: 1rem;
    font-size: 1.15rem;
    font-weight: 900;
    border-radius: 0.75rem;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    text-transform: uppercase;
  }

  .btn-done.submitted {
    background: #334155;
    box-shadow: none;
    color: #94a3b8;
    border-color: #475569;
  }

  .earpiece-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: #003566;
    color: #90e0ef;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
    border: 1px solid #90e0ef;
  }

  .earpiece-pill.active {
    border-color: #ffb703;
    color: #ffb703;
  }

  .earpiece-pill.speaking {
    background: #ffb703;
    color: #001219;
    border-color: #ffffff;
    box-shadow: 0 0 12px rgba(255, 183, 3, 0.8);
    animation: earpiecePulse 1s infinite alternate;
  }

  @keyframes earpiecePulse {
    0% { transform: scale(1); }
    100% { transform: scale(1.05); }
  }
</style>
