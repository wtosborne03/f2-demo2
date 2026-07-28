<script lang="ts">
  import { onDestroy } from "svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let isMicActive = false;
  let micError = "";
  let votedValue: boolean | null = null;

  onDestroy(() => {
    if (isMicActive) {
      gameClient.stopAudioStream();
    }
  });

  async function toggleMicrophone() {
    micError = "";
    if (isMicActive) {
      console.log("[Joker Spectator UI] Stopping microphone audio stream");
      gameClient.stopAudioStream();
      isMicActive = false;
    } else {
      console.log("[Joker Spectator UI] Starting microphone audio stream");
      const success = await gameClient.startAudioStream();
      if (success) {
        isMicActive = true;
        console.log("[Joker Spectator UI] Microphone active! Streaming to Host...");
      } else {
        isMicActive = false;
        micError = "Could not access microphone.";
      }
    }
  }

  function handleVote(satisfied: boolean) {
    votedValue = satisfied;
    gameClient.sendPlayerInput("satisfaction_vote", { satisfied });
  }
</script>

<div class="joker-spectator-container">
  <header class="header">
    <div class="badge-row">
      <span class="crew-pill">CREW MEMBER</span>
      <span class="joker-pill">JOKER: {$gameState.page_data?.jokerName || "Performer"}</span>
    </div>
    <h2>{$gameState.page_data?.jokerName || "The Joker"} is on the spot!</h2>
    <p class="challenge-desc">Talk in their earpiece and give them hilarious commands to perform!</p>
  </header>

  <main class="main-controls">
    <!-- Earpiece Microphone Push-to-Talk -->
    <div class="mic-section">
      <button
        type="button"
        class="mic-btn {isMicActive ? 'active' : ''}"
        on:click={toggleMicrophone}
      >
        <span class="mic-icon">🎙️</span>
        <span class="mic-text">
          {isMicActive ? "TALKING IN EARPIECE..." : "TAP TO TALK IN EARPIECE"}
        </span>
      </button>
      {#if micError}
        <p class="error">{micError}</p>
      {/if}
    </div>

    <!-- Thumbs Up / Thumbs Down Voting Buttons -->
    <div class="vote-section">
      <h3>CAST YOUR JUDGMENT:</h3>
      <div class="vote-buttons-grid">
        <button
          class="vote-btn thumbs-up {votedValue === true ? 'voted' : ''}"
          on:click={() => handleVote(true)}
        >
          <span>👍</span>
          <span>PASSED</span>
        </button>

        <button
          class="vote-btn thumbs-down {votedValue === false ? 'voted' : ''}"
          on:click={() => handleVote(false)}
        >
          <span>👎</span>
          <span>FAILED</span>
        </button>
      </div>
      {#if votedValue !== null}
        <p class="voted-status">
          You voted: {votedValue ? "THUMBS UP 👍" : "THUMBS DOWN 👎"}
        </p>
      {/if}
    </div>
  </main>
</div>

<style>
  .joker-spectator-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    background: #0077b6;
    color: #ffffff;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 1.25rem;
    box-sizing: border-box;
  }

  .header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .badge-row {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .crew-pill {
    background: #003566;
    color: #90e0ef;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
  }

  .joker-pill {
    background: rgba(230, 57, 70, 0.2);
    border: 1px solid #e63946;
    color: #ff4d6d;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
  }

  h2 {
    font-size: 1.4rem;
    margin: 0 0 0.25rem 0;
    color: #ffb703;
    font-weight: 900;
    text-shadow: 2px 2px 0px #000;
  }

  .challenge-desc {
    font-size: 0.95rem;
    color: #caf0f8;
    margin: 0;
    line-height: 1.3;
    font-weight: 600;
  }

  .main-controls {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1.75rem;
  }

  .mic-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .mic-btn {
    width: 100%;
    background: #003566;
    border: 4px solid #ffb703;
    border-radius: 1.25rem;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: #ffb703;
    font-weight: 900;
    font-size: 1.1rem;
    cursor: pointer;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
    transition: all 0.2s ease;
  }

  .mic-btn.active {
    background: #e63946;
    border-color: #ffffff;
    color: white;
    box-shadow: 0 0 25px rgba(230, 57, 70, 0.7);
    animation: micPulse 1.2s infinite ease-in-out;
  }

  @keyframes micPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.03); }
  }

  .mic-icon {
    font-size: 1.8rem;
  }

  .error {
    color: #ff4d6d;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }

  .vote-section {
    width: 100%;
    background: #003566;
    border-radius: 1.25rem;
    padding: 1.25rem;
    border: 2px solid #ffffff;
    text-align: center;
  }

  .vote-section h3 {
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
    color: #90e0ef;
    letter-spacing: 0.05em;
    font-weight: 900;
  }

  .vote-buttons-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .vote-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 1rem 0.5rem;
    border-radius: 0.85rem;
    font-weight: 900;
    font-size: 1.1rem;
    border: 2px solid white;
    cursor: pointer;
    color: white;
    transition: transform 0.15s ease;
  }

  .vote-btn span:first-child {
    font-size: 2.2rem;
  }

  .vote-btn.thumbs-up {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  .vote-btn.thumbs-down {
    background: linear-gradient(135deg, #e63946, #d90429);
  }

  .vote-btn.voted {
    transform: scale(0.95);
    box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.5);
    border-color: #ffb703;
  }

  .voted-status {
    margin: 0.85rem 0 0 0;
    font-size: 0.95rem;
    color: #ffb703;
    font-weight: 800;
  }
</style>
