<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let votedIndex: number | null = null;

  $: choices =
    $gameState.page_data?.choices || $gameState.page_data?.options || [];

  function handleVote(index: number) {
    votedIndex = index;

    gameClient.sendPlayerInput("task_vote", {
      choiceIndex: index,
      voteIndex: index,
      choice: index,
    });
  }
</script>

<div class="joker-vote-container">
  <header class="header">
    <div class="badge-row">
      <span class="crew-pill">CREW MEMBER</span>
      <span class="vote-pill">PHASE 2: DARE VOTING</span>
    </div>
    <h2>{$gameState.page_data?.prompt || "Vote for the Winning Dare!"}</h2>
    <p class="desc">
      Tap the funny dare you want the Joker to perform live on camera!
    </p>
  </header>

  <main class="main-content">
    <div class="choices-list">
      {#each choices as choice, idx}
        <button
          type="button"
          class="choice-btn"
          class:voted={votedIndex === idx}
          on:click={() => handleVote(idx)}
        >
          <div class="choice-num">OPTION #{idx + 1}</div>
          <div class="choice-text">"{choice}"</div>
          {#if votedIndex === idx}
            <div class="voted-badge">VOTED 🗳️</div>
          {/if}
        </button>
      {/each}
    </div>

    {#if votedIndex !== null}
      <div class="status-banner">
        Vote cast! Waiting for results on the host screen...
      </div>
    {/if}
  </main>
</div>

<style>
  .joker-vote-container {
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

  .vote-pill {
    background: rgba(230, 57, 70, 0.2);
    border: 1px solid #e63946;
    color: #ff4d6d;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
  }

  h2 {
    font-size: 1.3rem;
    margin: 0 0 0.25rem 0;
    color: #ffb703;
    font-weight: 900;
    text-shadow: 2px 2px 0px #000;
  }

  .desc {
    font-size: 0.9rem;
    color: #caf0f8;
    margin: 0;
    line-height: 1.3;
    font-weight: 600;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
    overflow-y: auto;
  }

  .choices-list {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    width: 100%;
  }

  .choice-btn {
    background: #003566;
    border: 3px solid #00b4d8;
    border-radius: 1rem;
    padding: 1.1rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.35rem;
    color: white;
    cursor: pointer;
    text-align: left;
    position: relative;
    transition: all 0.15s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .choice-btn:active {
    transform: scale(0.97);
  }

  .choice-btn.voted {
    border-color: #ffb703;
    background: rgba(255, 183, 3, 0.15);
    box-shadow: 0 0 20px rgba(255, 183, 3, 0.4);
  }

  .choice-num {
    font-size: 0.75rem;
    font-weight: 900;
    color: #ffb703;
    letter-spacing: 0.05em;
  }

  .choice-text {
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.35;
    color: #ffffff;
  }

  .voted-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background: #ffb703;
    color: #001b2e;
    font-size: 0.75rem;
    font-weight: 900;
    padding: 0.2rem 0.65rem;
    border-radius: 0.5rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }

  .status-banner {
    text-align: center;
    font-size: 0.95rem;
    font-weight: 800;
    color: #ffb703;
    background: rgba(0, 53, 102, 0.9);
    padding: 0.75rem;
    border-radius: 0.75rem;
    border: 1px solid #ffb703;
  }
</style>
