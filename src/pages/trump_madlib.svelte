<script lang="ts">
  import { get } from "svelte/store";
  import type { TrumpMadlibData } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import GameSubmit from "$lib/components/game/gameSubmit.svelte";

  interface ExtendedTrumpMadlibData extends TrumpMadlibData {
    template: string;
    slotIndex: number;
    slots: { type: string; description: string }[];
  }

  let m_data: ExtendedTrumpMadlibData;
  m_data = get(gameState).page_data as ExtendedTrumpMadlibData;

  let word_text = "";

  function submit_word() {
    gameClient.sendPlayerInput("promptTextData", { answer: word_text });
  }

  // Parse template into parts
  $: parts = parseTemplate(
    m_data?.template || "",
    m_data?.slots || [],
    m_data?.slotIndex ?? 0,
  );

  function parseTemplate(template: string, slots: any[], activeIndex: number) {
    if (!template) return [];

    const regex = /\[(\d+)\]/g;
    const result: any[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(template)) !== null) {
      const matchIndex = match.index;
      const slotNum = parseInt(match[1], 10);

      // Push preceding text
      if (matchIndex > lastIndex) {
        result.push({
          text: template.substring(lastIndex, matchIndex),
          isSlot: false,
        });
      }

      // Push slot info
      const slotType = slots[slotNum]?.type || "word";
      result.push({
        index: slotNum,
        isSlot: true,
        type: slotType,
        isActive: slotNum === activeIndex,
      });

      lastIndex = regex.lastIndex;
    }

    // Push trailing text
    if (lastIndex < template.length) {
      result.push({
        text: template.substring(lastIndex),
        isSlot: false,
      });
    }

    return result;
  }
</script>

<div
  class="madlib-container h-full overflow-y-auto w-screen flex flex-col justify-center items-center p-3"
>
  <div class="madlib-card w-full">
    <div class="predicament-text text-center">
      "{m_data?.predicament || "Audience question loading..."}"
    </div>

    <div class="template-preview text-center">
      {#each parts as part}
        {#if part.isSlot}
          {#if part.isActive}
            <span class="active-blank">
              {word_text || `[ENTER ${part.type.toUpperCase()}]`}
            </span>
          {:else}
            <span class="other-blank">
              [{part.type}]
            </span>
          {/if}
        {:else}
          <span>{part.text}</span>
        {/if}
      {/each}
    </div>

    <div class="prompt-instruction text-center">
      Enter a <span class="highlight-speech">{m_data?.wordType || "word"}</span>
      ({m_data?.description || "creative word"}) to complete the solution!
    </div>

    <form
      class="flex flex-col justify-center items-center w-full"
      on:submit|preventDefault={submit_word}
    >
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
  }

  .madlib-card {
    height: fit-content;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    max-width: 700px;
    padding: 2.5rem 1.5rem;
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
    margin-bottom: 1rem;
    font-weight: 500;
    font-style: italic;
  }

  .template-preview {
    font-family: "Georgia", serif;
    font-size: 1.25rem;
    line-height: 1.8;
    color: #374151;
    margin: 1.5rem 0;
    padding: 1.5rem;
    background: #f3f4f6;
    border-radius: 12px;
    border-left: 4px solid #1e3a8a;
    border-right: 4px solid #dc2626;
    text-align: center;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .active-blank {
    color: #dc2626;
    font-weight: 800;
    text-decoration: underline;
    background: rgba(220, 38, 38, 0.08);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px dashed rgba(220, 38, 38, 0.4);
  }

  .other-blank {
    color: #1e3a8a;
    font-weight: 600;
    background: rgba(30, 58, 138, 0.05);
    padding: 2px 6px;
    border-radius: 4px;
    opacity: 0.85;
  }

  .prompt-instruction {
    font-family: "Georgia", serif;
    font-size: 1.25rem;
    line-height: 1.5;
    color: #111827;
    margin-bottom: 1.5rem;
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
