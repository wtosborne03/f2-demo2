<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type { PromptData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  import type { PlayerInputPayload } from "$lib/wsapi/game";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  let m_data: PromptData;
  m_data = get(gameState).page_data;

  let answer_text = "";

  function submit_prompt() {
    gameClient.sendPlayerInput("promptTextData", { answer: answer_text });
  }
</script>

<div
  class="debate-container h-full overflow-y-auto w-screen flex flex-col justify-center items-center p-3"
>
  <div class="debate-card w-full">
    <div class="debate-header text-center">
      <span class="stars-decoration">★</span>
      Presidential Question
      <span class="stars-decoration">★</span>
    </div>

    <div class="question-text text-center">
      "{m_data.question}"
    </div>

    <form class="flex flex-col justify-center items-center w-full">
      <input
        class="answer-input text-black"
        type="text"
        maxlength="64"
        placeholder="Enter your response..."
        bind:value={answer_text}
        on:submit={submit_prompt}
      />
      <GameSubmit onSubmit={submit_prompt} />
    </form>
  </div>
</div>

<style>
  .debate-container {
    background: linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #7f1d1d 100%);
    min-height: 100vh;
  }

  .debate-card {
    height: fit-content;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    max-width: 700px;
    padding: 3rem 1.5rem;
  }

  .debate-header {
    font-family: "Georgia", serif;
    font-size: 1rem;
    font-weight: 600;
    color: #1e3a8a;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 1.5rem;
    border-bottom: 3px solid #dc2626;
    padding-bottom: 0.75rem;
  }

  .question-text {
    font-family: "Georgia", serif;
    font-size: 1.5rem;
    line-height: 1.6;
    color: #1f2937;
    margin-bottom: 2rem;
    font-weight: 500;
    font-style: italic;
  }

  .answer-input {
    width: 100%;
    padding: 1rem 1.25rem;
    font-size: 1.125rem;
    border: 2px solid #cbd5e1;
    border-radius: 8px;
    transition: all 0.3s ease;
    font-family: "Georgia", serif;
    background: white;
  }

  .answer-input:focus {
    outline: none;
    border-color: #1e3a8a;
    box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
  }

  .submit-button {
    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
    color: white;
    font-family: "Georgia", serif;
    font-size: 1.125rem;
    font-weight: 700;
    padding: 0.875rem 3rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: 2rem;
    box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
  }

  .submit-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  }

  .submit-button:active {
    transform: translateY(0);
  }

  .stars-decoration {
    color: #1e3a8a;
    font-size: 1.5rem;
    margin: 0 0.5rem;
  }
</style>
