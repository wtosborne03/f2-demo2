<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let isStreaming = false;
  let videoEl: HTMLVideoElement | null = null;
  let errorMessage = "";
  let selectedEmoji = "";

  const reactions = ["🔥", "🎉", "😱", "👏", "❤️", "🚀", "👑", "⚡"];

  onMount(() => {
    // Attempt auto-start camera stream if supported
    handleStartStream();
  });

  onDestroy(() => {
    gameClient.stopVideoStream();
  });

  async function handleStartStream() {
    errorMessage = "";
    const success = await gameClient.startVideoStream();
    if (success) {
      isStreaming = true;
      if (videoEl && gameClient.localStream) {
        videoEl.srcObject = gameClient.localStream;
      }
    } else {
      errorMessage = "Could not access camera. Please allow camera permissions.";
    }
  }

  function handleStopStream() {
    gameClient.stopVideoStream();
    isStreaming = false;
    if (videoEl) {
      videoEl.srcObject = null;
    }
  }

  function sendReaction(emoji: string) {
    selectedEmoji = emoji;
    gameClient.sendPlayerInput("reaction", { emoji });
    setTimeout(() => {
      if (selectedEmoji === emoji) selectedEmoji = "";
    }, 800);
  }
</script>

<div class="video-stream-container">
  <header class="header">
    <div class="badge-row">
      <span class="live-pill" class:active={isStreaming}>
        <span class="dot"></span>
        {isStreaming ? "LIVE BROADCASTING" : "STANDBY"}
      </span>
      <span class="webrtc-pill">WebRTC P2P</span>
    </div>
    <h2>{$gameState.page_data?.instructions || "Live Phone Camera Stream"}</h2>
  </header>

  <main class="preview-area">
    <!-- Local Camera Preview -->
    <div class="video-wrapper">
      <video
        bind:this={videoEl}
        autoplay
        playsinline
        muted
        class="camera-preview"
      ></video>

      {#if !isStreaming}
        <div class="placeholder-overlay">
          <div class="cam-icon">📹</div>
          <p>Camera is currently off</p>
          {#if errorMessage}
            <p class="error">{errorMessage}</p>
          {/if}
          <button class="btn-start" on:click={handleStartStream}>
            Start Live Camera
          </button>
        </div>
      {:else}
        <div class="live-overlay">
          <div class="hud-top">
            <span class="hud-badge">HD 720p</span>
            <span class="hud-badge">Direct P2P</span>
          </div>
          <button class="btn-stop" on:click={handleStopStream}>
            Stop Camera
          </button>
        </div>
      {/if}
    </div>
  </main>

  <footer class="controls-section">
    <h3>Send Live Reaction to TV</h3>
    <div class="reaction-grid">
      {#each reactions as emoji}
        <button
          class="reaction-btn"
          class:pop={selectedEmoji === emoji}
          on:click={() => sendReaction(emoji)}
        >
          {emoji}
        </button>
      {/each}
    </div>
  </footer>
</div>

<style>
  .video-stream-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background: #0f172a;
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
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .live-pill.active {
    background: #ef4444;
    color: #ffffff;
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }

  .webrtc-pill {
    background: #1e293b;
    border: 1px solid #3b82f6;
    color: #60a5fa;
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  h2 {
    font-size: 1.1rem;
    margin: 0;
    color: #cbd5e1;
  }

  .preview-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    min-height: 240px;
  }

  .video-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    max-height: 380px;
    border-radius: 1rem;
    overflow: hidden;
    background: #020617;
    border: 2px solid #334155;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
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
    text-align: center;
  }

  .cam-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  .error {
    color: #f87171;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .btn-start {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 700;
    border-radius: 0.75rem;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
    transition: transform 0.15s ease;
  }

  .btn-start:active {
    transform: scale(0.96);
  }

  .live-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.75rem;
  }

  .hud-top {
    display: flex;
    gap: 0.5rem;
  }

  .hud-badge {
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    color: #38bdf8;
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    border-radius: 0.35rem;
    font-family: monospace;
  }

  .btn-stop {
    pointer-events: auto;
    align-self: flex-end;
    background: rgba(225, 29, 72, 0.85);
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .controls-section {
    margin-top: 1rem;
    background: #1e293b;
    border-radius: 1rem;
    padding: 1rem;
  }

  h3 {
    font-size: 0.9rem;
    color: #94a3b8;
    margin: 0 0 0.75rem 0;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .reaction-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
  }

  .reaction-btn {
    background: #334155;
    border: 1px solid #475569;
    font-size: 1.5rem;
    padding: 0.6rem;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .reaction-btn:active, .reaction-btn.pop {
    transform: scale(1.2);
    background: #3b82f6;
    border-color: #60a5fa;
  }
</style>
