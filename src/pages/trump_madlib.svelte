<script lang="ts">
  import { get } from "svelte/store";
  import type { TrumpMadlibData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  let m_data: TrumpMadlibData;
  m_data = get(gameState).page_data;

  let word_text = "";

  function submit_word() {
    gameClient.sendPlayerInput("promptTextData", { answer: word_text });
  }
</script>

<div
  class="madlib-container h-full overflow-y-auto w-screen flex flex-col justify-center items-center p-3"
>
  <div class="madlib-card w-full">
    <div class="madlib-header text-center">
      <span class="stars-decoration">★</span>
      Final Predicament
      <span class="stars-decoration">★</span>
    </div>

    <div class="predicament-text text-center">
      "{m_data?.predicament || "Audience question loading..."}"
    </div>

    <div class="prompt-instruction text-center">
      Enter a <span class="highlight-speech">{m_data?.wordType || "word"}</span> ({m_data?.description || "creative word"}) to complete the solution!
    </div>

    <form class="flex flex-col justify-center items-center w-full" on:submit|preventDefault={submit_word}>
      <input
        id="trump-madlib-input"
        class="answer-input text-black"
        type="text"
        maxlength="40"
        placeholder="Enter a {m_data?.wordType || 'word'}..."
        bind:value={word_text}
      />
      <GameSubmit onSubmit={submit_word} />
    </form>
  </div>
</div>

<style>
  .madlib-container {
    background: linear-gradient(135deg, #1e3a8a 0%, #312e81 50%, #7f1d1d 100%);
    min-height: 100vh;
  }

  .madlib-card {
    height: fit-content;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    max-width: 700px;
    padding: 3rem 1.5rem;
  }

  .madlib-header {
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

  .predicament-text {
    font-family: "Georgia", serif;
    font-size: 1.3rem;
    line-height: 1.6;
    color: #4b5563;
    margin-bottom: 1.5rem;
    font-weight: 500;
    font-style: italic;
  }

  .prompt-instruction {
    font-family: "Georgia", serif;
    font-size: 1.4rem;
    line-height: 1.5;
    color: #111827;
    margin-bottom: 2rem;
    font-weight: 600;
  }

  .highlight-speech {
    color: #dc2626;
    text-decoration: underline;
    text-transform: uppercase;
    font-weight: 800;
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

  .stars-decoration {
    color: #1e3a8a;
    font-size: 1.5rem;
    margin: 0 0.5rem;
  }
</style>
