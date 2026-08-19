<script lang="ts">
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  let dareText = "";
  let submitted = false;

  function handleSubmit() {
    if (!dareText.trim()) return;
    submitted = true;

    gameClient.sendPlayerInput("task_submission", {
      text: dareText.trim(),
      submission: dareText.trim(),
      task: dareText.trim(),
      value: dareText.trim(),
    });
  }
</script>

<div class="joker-submit-container">
  <header class="header">
    <div class="badge-row">
      <span class="crew-pill">CREW MEMBER</span>
      <span class="dare-pill">PHASE 1: DARE CREATION</span>
    </div>
    <h2>{$gameState.page_data?.prompt || "Submit a realistic dare!"}</h2>
    <p class="desc">
      {$gameState.page_data?.desc ||
        "Make sure your dare is realistic! A random player will be chosen to carry it out live in a video livestream."}
    </p>
  </header>

  <main class="main-content">
    {#if !submitted}
      <form on:submit|preventDefault={handleSubmit} class="submit-form">
        <textarea
          class="dare-textarea"
          bind:value={dareText}
          placeholder={$gameState.page_data?.placeholder ||
            "e.g., Speak in a dramatic opera voice for 45 seconds..."}
          maxlength={120}
          rows={4}
          required
        ></textarea>

        <div class="char-count">
          {dareText.length}/120 characters
        </div>

        <button type="submit" class="btn-submit" disabled={!dareText.trim()}>
          SUBMIT DARE TO CREW ✏️
        </button>
      </form>
    {:else}
      <div class="submitted-confirmation">
        <div class="stamp-icon">✏️</div>
        <h3>DARE SUBMITTED!</h3>
        <p class="submission-preview">"{dareText}"</p>
        <p class="waiting-text">
          Waiting for host and other players to finish...
        </p>
      </div>
    {/if}
  </main>
</div>

<style>
  .joker-submit-container {
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

  .dare-pill {
    background: rgba(255, 183, 3, 0.2);
    border: 1px solid #ffb703;
    color: #ffb703;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 800;
  }

  h2 {
    font-size: 1.35rem;
    margin: 0 0 0.35rem 0;
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
  }

  .submit-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .dare-textarea {
    width: 100%;
    background: #001219;
    border: 3px solid #ffb703;
    border-radius: 1rem;
    padding: 1rem;
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 700;
    resize: none;
    box-sizing: border-box;
    outline: none;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5);
  }

  .dare-textarea:focus {
    border-color: #ffffff;
    box-shadow:
      inset 0 2px 8px rgba(0, 0, 0, 0.5),
      0 0 15px rgba(255, 183, 3, 0.5);
  }

  .char-count {
    text-align: right;
    font-size: 0.8rem;
    color: #90e0ef;
    font-weight: 700;
  }

  .btn-submit {
    width: 100%;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: 2px solid white;
    padding: 1rem;
    font-size: 1.15rem;
    font-weight: 900;
    border-radius: 0.85rem;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    text-transform: uppercase;
    transition: transform 0.15s ease;
  }

  .btn-submit:disabled {
    background: #334155;
    color: #94a3b8;
    border-color: #475569;
    box-shadow: none;
    cursor: not-allowed;
  }

  .btn-submit:active:not(:disabled) {
    transform: scale(0.96);
  }

  .submitted-confirmation {
    background: #003566;
    border: 3px solid #10b981;
    border-radius: 1.25rem;
    padding: 2rem 1.5rem;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }

  .stamp-icon {
    font-size: 3.5rem;
    margin-bottom: 0.5rem;
  }

  .submitted-confirmation h3 {
    color: #10b981;
    font-size: 1.4rem;
    margin: 0 0 1rem 0;
    font-weight: 900;
    text-transform: uppercase;
  }

  .submission-preview {
    font-size: 1.15rem;
    font-weight: 700;
    color: #ffb703;
    font-style: italic;
    margin: 0 0 1.25rem 0;
    line-height: 1.4;
  }

  .waiting-text {
    font-size: 0.9rem;
    color: #90e0ef;
    margin: 0;
    font-weight: 600;
  }
</style>
