<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let votedValue: boolean | null = null;

  function handleVote(satisfied: boolean) {
    votedValue = satisfied;
    console.log("[Joker Spectator UI] Voting satisfaction:", satisfied);
    gameClient.sendPlayerInput("satisfaction_vote", { satisfied });
  }
</script>

<div class="joker-spectator-container">
  <header class="header">
    <div class="badge-row">
      <span class="crew-pill">CREW MEMBER</span>
      <span class="joker-pill">JOKER: {$gameState.page_data?.jokerName || "Performer"}</span>
    </div>
    <h2>{$gameState.page_data?.jokerName || "The Joker"} is performing!</h2>
    <p class="challenge-desc">
      {$gameState.page_data?.challengeDescription || "Watch the Joker carry out the dare!"}
    </p>
  </header>

  <main class="main-controls">
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
    margin-bottom: 1.25rem;
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
    margin: 0 0 0.35rem 0;
    color: #ffb703;
    font-weight: 900;
    text-shadow: 2px 2px 0px #000;
  }

  .challenge-desc {
    font-size: 1rem;
    color: #caf0f8;
    margin: 0;
    line-height: 1.35;
    font-weight: 700;
    font-style: italic;
  }

  .main-controls {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .vote-section {
    width: 100%;
    background: #003566;
    border-radius: 1.25rem;
    padding: 1.5rem 1.25rem;
    border: 3px solid #ffffff;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    box-sizing: border-box;
  }

  .vote-section h3 {
    margin: 0 0 1.25rem 0;
    font-size: 1.05rem;
    color: #ffb703;
    letter-spacing: 0.05em;
    font-weight: 900;
  }

  .vote-buttons-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .vote-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    padding: 1.25rem 0.5rem;
    border-radius: 1rem;
    font-weight: 900;
    font-size: 1.15rem;
    border: 3px solid white;
    cursor: pointer;
    color: white;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .vote-btn span:first-child {
    font-size: 2.5rem;
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
    margin: 1.25rem 0 0 0;
    font-size: 1.05rem;
    color: #ffb703;
    font-weight: 800;
  }
</style>
