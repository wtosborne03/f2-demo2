<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let isStreaming = false;
  let videoEl: HTMLVideoElement | null = null;
  let earpieceAudioEl: HTMLAudioElement | null = null;
  let errorMessage = "";
  let taskSubmitted = false;
  let earpieceStatus = "Waiting for spectator voice...";

  onMount(() => {
    handleStartPerformerStream();

    // Listen for incoming spectator earpiece audio track forwarded from Host
    const handleRemoteTrack = (data: { stream: MediaStream; track?: MediaStreamTrack }) => {
      console.log("[Joker Performer UI] Received spectator earpiece audio stream track!", data.stream?.id, data.track?.kind);
      earpieceStatus = `🎙️ Spectator Voice Live!`;

      if (earpieceAudioEl) {
        earpieceAudioEl.srcObject = data.stream;
        earpieceAudioEl.play()
          .then(() => {
            console.log("[Joker Performer UI] Earpiece audio element playing successfully!");
          })
          .catch((err) => {
            console.warn("[Joker Performer UI] Earpiece audio play error:", err);
            earpieceStatus = `Audio blocked by browser: ${err.message}`;
          });
      } else {
        console.warn("[Joker Performer UI] earpieceAudioEl element ref is null!");
      }
    };

    gameClient.on("remoteTrack", handleRemoteTrack);

    return () => {
      gameClient.off("remoteTrack", handleRemoteTrack);
      gameClient.stopVideoStream();
    };
  });

  onDestroy(() => {
    gameClient.stopVideoStream();
  });

  async function handleStartPerformerStream() {
    errorMessage = "";
    console.log("[Joker Performer UI] Starting performer camera stream...");
    // User gesture unlock for mobile web audio autoplay
    if (earpieceAudioEl) {
      earpieceAudioEl.play().catch(() => {});
    }
    const success = await gameClient.startVideoStream();
    if (success) {
      isStreaming = true;
      console.log("[Joker Performer UI] Camera stream started successfully!");
      if (videoEl && gameClient.localStream) {
        videoEl.srcObject = gameClient.localStream;
      }
    } else {
      console.error("[Joker Performer UI] Failed to start camera stream");
      errorMessage = "Could not access camera. Please check camera permissions.";
    }
  }

  function handleTaskDone() {
    taskSubmitted = true;
    gameClient.sendPlayerInput("task_done");
  }
</script>

<div class="joker-performer-container">
  <!-- Earpiece Audio element for listening to spectator microphones -->
  <audio bind:this={earpieceAudioEl} autoplay playsinline style="display: none;"></audio>

  <header class="header">
    <div class="badge-row">
      <span class="live-pill" class:active={isStreaming}>
        <span class="dot"></span>
        {isStreaming ? "YOU ARE THE JOKER (LIVE)" : "CONNECTING CAMERA..."}
      </span>
      <span class="earpiece-pill">🎧 {earpieceStatus}</span>
    </div>
    <h2>{$gameState.page_data?.challengeTitle || "Your Impractical Joker Challenge"}</h2>
  </header>

  <!-- Local Camera Preview -->
  <main class="preview-area">
    <div class="video-wrapper">
      <video bind:this={videoEl} autoplay playsinline muted class="camera-preview"></video>

      {#if !isStreaming}
        <div class="placeholder-overlay">
          <div class="cam-icon">📹</div>
          <p>Camera is currently off</p>
          {#if errorMessage}
            <p class="error">{errorMessage}</p>
          {/if}
          <button class="btn-start" on:click={handleStartPerformerStream}>
            Start Camera & Earpiece
          </button>
        </div>
      {/if}
    </div>

    <!-- Challenge Instructions -->
    <div class="challenge-box">
      <h3>YOUR DARE:</h3>
      <p>{$gameState.page_data?.challengeDescription || "Complete the dare given to you!"}</p>
    </div>
  </main>

  <footer class="footer-section">
    <button
      class="btn-done"
      class:submitted={taskSubmitted}
      on:click={handleTaskDone}
      disabled={taskSubmitted}
    >
      {taskSubmitted ? "TASK SUBMITTED! WAITING FOR VOTES..." : "I FINISHED THE TASK! 👍"}
    </button>
  </footer>
</div>

<style>
  .joker-performer-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background: #090d16;
    color: #f8fafc;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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
    background: #334155;
    color: #94a3b8;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
  }

  .live-pill.active {
    background: #ef4444;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
  }

  .earpiece-pill {
    background: #1e293b;
    border: 1px solid #10b981;
    color: #34d399;
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  h2 {
    font-size: 1.2rem;
    margin: 0;
    color: #f43f5e;
    font-weight: 900;
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
    height: 240px;
    border-radius: 1rem;
    overflow: hidden;
    background: #020617;
    border: 3px solid #f43f5e;
    box-shadow: 0 10px 25px rgba(244, 63, 94, 0.3);
  }

  .camera-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scaleX(-1);
  }

  .placeholder-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(15, 23, 42, 0.9);
    padding: 1rem;
  }

  .btn-start {
    background: linear-gradient(135deg, #f43f5e, #e11d48);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 800;
    border-radius: 0.75rem;
    cursor: pointer;
  }

  .challenge-box {
    background: #1e293b;
    border-left: 5px solid #a855f7;
    border-radius: 0.75rem;
    padding: 1rem;
  }

  .challenge-box h3 {
    margin: 0 0 0.4rem 0;
    font-size: 0.85rem;
    color: #a855f7;
    letter-spacing: 0.05em;
  }

  .challenge-box p {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.4;
    color: #e2e8f0;
    font-weight: 700;
  }

  .footer-section {
    margin-top: 1rem;
  }

  .btn-done {
    width: 100%;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 900;
    border-radius: 0.75rem;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    transition: transform 0.15s ease;
  }

  .btn-done.submitted {
    background: #334155;
    box-shadow: none;
    color: #94a3b8;
  }
</style>
