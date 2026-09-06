<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

  const PASTEL_COLORS = [
    "#ffe4e6", // pastel rose
    "#fef08a", // pastel yellow
    "#bbf7d0", // pastel mint green
    "#bfdbfe", // pastel sky blue
    "#fed7aa", // pastel peach
    "#e9d5ff", // pastel lavender
    "#c7d2fe", // pastel periwinkle
    "#a7f3d0", // pastel seafoam
    "#fbcfe8", // pastel bubblegum pink
    "#fef9c3", // pastel lemon
    "#e0e7ff", // pastel soft indigo
    "#ccfbf1", // pastel ice teal
    "#fed7e2", // pastel blush
    "#d1fae5", // pastel soft matcha
  ];

  function getRandomPastelColor(seedStr?: string): string {
    if (seedStr) {
      let hash = 0;
      for (let i = 0; i < seedStr.length; i++) {
        hash = (hash << 5) - hash + seedStr.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % PASTEL_COLORS.length;
      return PASTEL_COLORS[idx];
    }
    return PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
  }

  function shadeColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));
    return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
  }

  let votedIndex: number | null = null;
  let hasSubmitted = false;

  $: pageData = $gameState.page_data || {};
  $: question = pageData.question || "Vote for your favorite!";
  $: title = pageData.title || "";
  $: roundNum = (pageData.aspectIndex ?? 0) + 1;
  $: totalRounds = pageData.aspectTotal ?? 5;

  // Standardize options array: supports either pageData.options or legacy pageData.answers
  $: choices = (() => {
    if (Array.isArray(pageData.options) && pageData.options.length > 0) {
      return pageData.options.map((opt: any) => {
        const text = typeof opt === "string" ? opt : opt.text;
        const color =
          (typeof opt === "object" && opt.color) || getRandomPastelColor(text);
        const author = typeof opt === "object" ? opt.author : undefined;
        return { text, color, author };
      });
    }
    if (Array.isArray(pageData.answers) && pageData.answers.length > 0) {
      return pageData.answers.map((ans: string) => ({
        text: ans,
        color: getRandomPastelColor(ans),
        author: undefined,
      }));
    }
    return [];
  })();

  function handleVote(index: number) {
    if (hasSubmitted) return;
    votedIndex = index;
    hasSubmitted = true;

    gameClient.sendInput({
      type: "multiple_choice",
      answer_index: index,
    });
  }
</script>

<div class="hitmakers-vote-screen">
  <!-- Top Marquee & Status Badge -->
  <header class="hitmakers-vote-header">
    <div class="marquee-row">
      <span class="marquee-pill">HITMAKERS</span>
      <span class="round-badge">ROUND {roundNum}/{totalRounds}</span>
    </div>

    <h2 class="vote-title">
      {#if title}
        Pick the Best <span class="highlight-text">{title}</span>
      {:else}
        {question}
      {/if}
    </h2>

    <p class="vote-sub">Tap your favorite card to vote on the big stage!</p>
  </header>

  <!-- Main Choices List with Identical Pastel Physics Card Styling -->
  <main class="choices-container">
    <div class="choices-list">
      {#each choices as choice, idx}
        {@const topColor = shadeColor(choice.color, 12)}
        {@const bottomColor = shadeColor(choice.color, -10)}
        {@const isSelected = votedIndex === idx}

        <button
          type="button"
          class="stage-card-btn"
          class:is-selected={isSelected}
          class:is-dimmed={hasSubmitted && !isSelected}
          style="--card-grad: linear-gradient(180deg, {topColor} 0%, {bottomColor} 100%);"
          disabled={hasSubmitted}
          on:click={() => handleVote(idx)}
        >
          <!-- Top Glossy Highlight (matches canvas glossy shine) -->
          <div class="card-gloss-shine" />

          <!-- Card Content -->
          <div class="card-body">
            <span class="card-text">{choice.text}</span>
          </div>

          <!-- Selected Stamped Badge -->
          {#if isSelected}
            <div class="voted-stamp">★ VOTED!</div>
          {/if}
        </button>
      {/each}
    </div>
  </main>

  <!-- Waiting Status Footer when Voted -->
  {#if hasSubmitted}
    <footer class="status-footer">
      <div class="status-pulse-dot" />
      <span class="status-text">
        Vote locked in! Look up at the big screen!
      </span>
    </footer>
  {/if}
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Bungee&family=Fredoka:wght@600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap");

  .hitmakers-vote-screen {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    max-width: 32rem;
    margin: 0 auto;
    padding: 1.25rem 1rem;
    box-sizing: border-box;
    font-family: "Fredoka", "Outfit", system-ui, sans-serif;
    color: #ffffff;
    user-select: none;
    overflow-y: auto;
  }

  /* Header */
  .hitmakers-vote-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin-bottom: 1.25rem;
    gap: 0.4rem;
  }

  .marquee-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin-bottom: 0.2rem;
  }

  .marquee-pill {
    background: #ff007f;
    color: #ffffff;
    font-family: "Bungee", cursive;
    font-size: 0.75rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    border: 2px solid #18181b;
    box-shadow: 0 3px 0 #18181b;
    letter-spacing: 0.08em;
  }

  .round-badge {
    background: #00f2fe;
    color: #0f172a;
    font-family: "Fredoka", sans-serif;
    font-weight: 900;
    font-size: 0.8rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    border: 2px solid #18181b;
    box-shadow: 0 3px 0 #18181b;
    letter-spacing: 0.04em;
  }

  .vote-title {
    font-size: 1.45rem;
    font-weight: 900;
    line-height: 1.25;
    margin: 0;
    color: #ffffff;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  }

  .highlight-text {
    color: #ffd700;
  }

  .vote-sub {
    font-size: 0.88rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.75);
    margin: 0;
  }

  /* Choices */
  .choices-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    margin-bottom: 1rem;
  }

  .choices-list {
    display: flex;
    flex-direction: column;
    gap: 0.95rem;
    width: 100%;
  }

  /* Stage Card Button (Identical to HitmakersPhysicsStage rounded card) */
  .stage-card-btn {
    position: relative;
    width: 100%;
    background: var(--card-grad);
    border: 3.5px solid #18181b;
    border-radius: 1.15rem;
    padding: 1.15rem 1.25rem;
    cursor: pointer;
    box-shadow:
      0 5px 0 #18181b,
      0 8px 16px rgba(0, 0, 0, 0.35);
    transition:
      transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.15s ease,
      opacity 0.2s ease,
      border-color 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    overflow: hidden;
  }

  .stage-card-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow:
      0 7px 0 #18181b,
      0 12px 20px rgba(0, 0, 0, 0.4);
  }

  .stage-card-btn:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow:
      0 2px 0 #18181b,
      0 4px 8px rgba(0, 0, 0, 0.25);
  }

  /* Top Glossy Highlight (matching the 42% height shine on stage canvas) */
  .card-gloss-shine {
    position: absolute;
    top: 3px;
    left: 4px;
    right: 4px;
    height: 38%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.55) 0%,
      rgba(255, 255, 255, 0.1) 100%
    );
    border-radius: 0.85rem 0.85rem 0.4rem 0.4rem;
    pointer-events: none;
  }

  .card-body {
    position: relative;
    z-index: 2;
    width: 100%;
  }

  /* Bold dark high-contrast text identical to stage: font 'Fredoka' 900 #0f172a */
  .card-text {
    font-family: "Fredoka", "Outfit", sans-serif;
    font-weight: 900;
    font-size: 1.25rem;
    line-height: 1.28;
    color: #0f172a;
    display: block;
    word-break: break-word;
  }

  /* Voted / Selected State */
  .stage-card-btn.is-selected {
    border-color: #ffd700;
    box-shadow:
      0 0 24px rgba(255, 215, 0, 0.75),
      0 5px 0 #18181b;
    transform: scale(1.02);
  }

  .stage-card-btn.is-dimmed {
    opacity: 0.45;
    filter: grayscale(0.2);
    cursor: default;
  }

  /* Comic Voted Stamp Badge */
  .voted-stamp {
    position: absolute;
    top: 0.5rem;
    right: 0.65rem;
    background: #ffd700;
    color: #120320;
    font-family: "Bungee", cursive;
    font-size: 0.75rem;
    padding: 0.2rem 0.55rem;
    border-radius: 0.5rem;
    border: 2px solid #18181b;
    box-shadow: 0 2px 0 #18181b;
    z-index: 3;
    animation: stampPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  @keyframes stampPop {
    0% {
      transform: scale(0) rotate(-15deg);
      opacity: 0;
    }
    70% {
      transform: scale(1.2) rotate(4deg);
      opacity: 1;
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }

  /* Status Footer */
  .status-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    background: rgba(18, 3, 32, 0.85);
    border: 2px solid #ffd700;
    border-radius: 0.85rem;
    padding: 0.75rem 1rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    animation: fadeIn 0.3s ease;
  }

  .status-pulse-dot {
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 9999px;
    background: #00ff88;
    box-shadow: 0 0 10px #00ff88;
    animation: pulseDot 1.4s infinite alternate;
  }

  @keyframes pulseDot {
    0% {
      transform: scale(0.8);
      opacity: 0.6;
    }
    100% {
      transform: scale(1.2);
      opacity: 1;
    }
  }

  .status-text {
    font-size: 0.95rem;
    font-weight: 800;
    color: #ffd700;
    letter-spacing: 0.02em;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
