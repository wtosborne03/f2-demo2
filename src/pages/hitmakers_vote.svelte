<script lang="ts">
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
  $: category = pageData.title || pageData.question || "Vote";

  // Standardize options array: supports either pageData.options or legacy pageData.answers
  $: choices = (() => {
    if (Array.isArray(pageData.options) && pageData.options.length > 0) {
      return pageData.options.map((opt: any) => {
        const text = typeof opt === "string" ? opt : opt.text;
        const color =
          (typeof opt === "object" && opt.color) || getRandomPastelColor(text);
        return { text, color };
      });
    }
    if (Array.isArray(pageData.answers) && pageData.answers.length > 0) {
      return pageData.answers.map((ans: string) => ({
        text: ans,
        color: getRandomPastelColor(ans),
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
  <!-- Voting Category Header -->
  <header class="category-header">
    <h1 class="category-title">{category}</h1>
  </header>

  <!-- Voting Choices Column with Matching Styling -->
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
        </button>
      {/each}
    </div>
  </main>
</div>

<style>
  @import url("https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700;800;900&family=Outfit:wght@600;700;800;900&display=swap");

  .hitmakers-vote-screen {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
    width: 100%;
    max-width: 28rem;
    margin: 0 auto;
    padding: 1.5rem 1.25rem;
    box-sizing: border-box;
    font-family: "Fredoka", "Outfit", system-ui, sans-serif;
    color: #ffffff;
    user-select: none;
    overflow-y: auto;
  }

  /* Voting Category Title at Top */
  .category-header {
    text-align: center;
    margin-bottom: 1.5rem;
    width: 100%;
  }

  .category-title {
    font-size: 2.1rem;
    font-weight: 900;
    line-height: 1.2;
    margin: 0;
    color: #ffffff;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
    letter-spacing: 0.02em;
  }

  /* Choices Column */
  .choices-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .choices-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  /* Stage Card Button (Identical to HitmakersPhysicsStage rounded card) */
  .stage-card-btn {
    position: relative;
    width: 100%;
    background: var(--card-grad);
    border: 3.5px solid #18181b;
    border-radius: 1.25rem;
    padding: 1.25rem 1.35rem;
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

  /* Top Glossy Highlight (matching the shine on stage canvas) */
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
    border-radius: 0.95rem 0.95rem 0.4rem 0.4rem;
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
    font-size: 1.3rem;
    line-height: 1.28;
    color: #0f172a;
    display: block;
    word-break: break-word;
  }

  /* Selected State */
  .stage-card-btn.is-selected {
    border-color: #ffd700;
    box-shadow:
      0 0 24px rgba(255, 215, 0, 0.75),
      0 5px 0 #18181b;
    transform: scale(1.02);
  }

  .stage-card-btn.is-dimmed {
    opacity: 0.35;
    filter: grayscale(0.3);
    cursor: default;
  }
</style>
