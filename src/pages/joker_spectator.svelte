<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let isMicActive = false;
  let micError = "";
  let votedSatisfied = false;
  let selectedEmoji = "";

  const reactions = ["🔥", "🎉", "😱", "👏", "❤️", "🚀", "👑", "⚡"];

  onDestroy(() => {
    if (isMicActive) {
      gameClient.stopAudioStream();
    }
  });

  async function toggleMicrophone() {
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

  function handleVoteSatisfied(satisfied: boolean) {
    votedSatisfied = satisfied;
    gameClient.sendPlayerInput("satisfaction_vote", { satisfied });
  }

  function sendReaction(emoji: string) {
    selectedEmoji = emoji;
    gameClient.sendPlayerInput("reaction", { emoji });
    setTimeout(() => {
      if (selectedEmoji === emoji) selectedEmoji = "";
    }, 800);
  }
</script>

<div class="joker-spectator-container">
  <header class="header">
    <div class="badge-row">
      <span class="crew-pill">CREW MEMBER</span>
      <span class="joker-pill">Joker: {$gameState.page_data?.jokerName || "Performer"}</span>
    </div>
    <h2>{$gameState.page_data?.challengeTitle || "Impractical Joker Dare"}</h2>
    <p class="challenge-desc">{$gameState.page_data?.challengeDescription || ""}</p>
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

    <!-- Satisfied Vote Button -->
    <div class="vote-section">
      <button
        class="vote-btn {votedSatisfied ? 'voted' : ''}"
        on:click={() => handleVoteSatisfied(true)}
      >
        {votedSatisfied ? "VOTED SATISFIED! 👍" : "I'M SATISFIED WITH DARE 👍"}
      </button>
    </div>
  </main>

  <footer class="reactions-footer">
    <h3>Send Reaction to TV Screen</h3>
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
  .joker-spectator-container {
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
    margin-bottom: 1rem;
  }

  .badge-row {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .crew-pill {
    background: #334155;
    color: #94a3b8;
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
  }

  .joker-pill {
    background: rgba(244, 63, 94, 0.2);
    border: 1px solid #f43f5e;
    color: #fb7185;
    padding: 0.25rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
  }

  h2 {
    font-size: 1.3rem;
    margin: 0 0 0.25rem 0;
    color: #38bdf8;
    font-weight: 900;
  }

  .challenge-desc {
    font-size: 0.95rem;
    color: #cbd5e1;
    margin: 0;
    line-height: 1.3;
  }

  .main-controls {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1.25rem;
  }

  .mic-section {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .mic-btn {
    width: 100%;
    background: #1e293b;
    border: 3px solid #3b82f6;
    border-radius: 1.25rem;
    padding: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: #60a5fa;
    font-weight: 800;
    font-size: 1.05rem;
    cursor: pointer;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    transition: all 0.2s ease;
  }

  .mic-btn.active {
    background: #ef4444;
    border-color: #f87171;
    color: white;
    box-shadow: 0 0 25px rgba(239, 68, 68, 0.6);
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
    color: #f87171;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }

  .vote-section {
    width: 100%;
  }

  .vote-btn {
    width: 100%;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 900;
    border-radius: 1rem;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .vote-btn.voted {
    background: #334155;
    color: #10b981;
    box-shadow: none;
  }

  .reactions-footer {
    background: #1e293b;
    border-radius: 1rem;
    padding: 0.85rem;
  }

  .reactions-footer h3 {
    font-size: 0.8rem;
    color: #94a3b8;
    margin: 0 0 0.5rem 0;
    text-align: center;
    text-transform: uppercase;
  }

  .reaction-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
  }

  .reaction-btn {
    background: #334155;
    border: 1px solid #475569;
    font-size: 1.4rem;
    padding: 0.5rem;
    border-radius: 0.6rem;
    cursor: pointer;
    transition: transform 0.15s ease;
  }

  .reaction-btn:active, .reaction-btn.pop {
    transform: scale(1.25);
    background: #3b82f6;
  }
</style>
