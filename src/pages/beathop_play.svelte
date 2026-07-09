<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Card, LoadingIndicator } from "m3-svelte";

  $: subState = $gameState.page_data?.subState || "listening";
  $: title = $gameState.page_data?.title || "Music Video";
  $: thumbnail = $gameState.page_data?.thumbnail || "";
  $: prompt = $gameState.page_data?.prompt || "";
  $: options = $gameState.page_data?.options || [];
  $: correctAnswer = $gameState.page_data?.correctAnswer || "";
  $: selectedAnswer = $gameState.page_data?.selectedAnswer || "";
  $: isCorrect = $gameState.page_data?.isCorrect === true;
  $: pointsGained = $gameState.page_data?.pointsGained || 0;
  $: roundScore = $gameState.page_data?.roundScore || 0;

  $: selectedIdx = options.indexOf(selectedAnswer);

  function submitAnswer(answer: string) {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(30);
    }
    gameClient.sendInput({
      type: "submit_lyric_answer",
      answer,
    });
  }

  const optionClasses = ["opt-rose", "opt-blue", "opt-green", "opt-amber"];
</script>

<div class="play-container">
  <!-- Sleek Header -->
  <header class="play-header">
    <div class="header-track-info">
      <span class="category-label">BeatHop</span>
      <h2 class="track-title" title={title}>{title}</h2>
    </div>
    <div class="score-badge">
      <span class="score-label">Score</span>
      <span class="score-value">{roundScore}</span>
    </div>
  </header>

  <!-- Main Interaction Area -->
  <main class="play-main">
    {#if subState === "listening"}
      <!-- Listening Mode Visualizer -->
      <div class="listening-view animate-fade-in">
        <div class="thumbnail-wrapper pulsing-glow">
          {#if thumbnail}
            <img src={thumbnail} alt="" class="hero-thumbnail" />
          {:else}
            <div class="thumbnail-placeholder">🎵</div>
          {/if}
        </div>
        
        <h3 class="status-msg">Listening closely...</h3>
        <p class="status-sub">Follow the lyrics on the main screen</p>

        <!-- CSS Audio Visualizer Wave -->
        <div class="eq-visualizer">
          {#each [1, 2, 3, 4, 5, 6, 7] as bar}
            <span
              class="eq-bar"
              style="animation-delay: {bar * 0.15}s; height: {30 + (bar % 3) * 25}%"
            ></span>
          {/each}
        </div>
      </div>

    {:else if subState === "question"}
      <!-- Lyric Question Mode -->
      <div class="question-view animate-fade-in">
        <!-- Compact Banner Thumbnail -->
        {#if thumbnail}
          <div class="banner-thumbnail-wrapper">
            <img src={thumbnail} alt="" class="banner-thumbnail" />
            <div class="banner-overlay"></div>
          </div>
        {/if}

        <!-- Prompt Card -->
        <Card variant="outlined" class="prompt-card-override">
          <p class="lyric-prompt">
            “{prompt}”
          </p>
        </Card>

        <!-- 4 Option Grid (Rose, Blue, Green, Amber) -->
        <div class="options-grid">
          {#each options as option, idx}
            <button
              class="opt-btn {optionClasses[idx]}"
              onclick={() => submitAnswer(option)}
            >
              <span class="option-text">{option}</span>
            </button>
          {/each}
        </div>
      </div>

    {:else if subState === "answered"}
      <!-- Answered and locking state -->
      <div class="answered-view animate-fade-in">
        <div class="loader-container">
          <LoadingIndicator size={56} />
        </div>
        
        <h3 class="status-msg">Locked in!</h3>
        <p class="status-sub">Waiting for other players...</p>

        {#if selectedAnswer}
          <div class="submitted-answer-capsule {selectedIdx !== -1 ? optionClasses[selectedIdx] : ''}">
            <span class="submitted-label">Your Guess:</span>
            <p class="submitted-text">“{selectedAnswer}”</p>
          </div>
        {/if}
      </div>

    {:else if subState === "outcome"}
      <!-- Outcome (Correct/Incorrect) State -->
      <div class="outcome-view animate-fade-in">
        <div class="outcome-status-wrapper {isCorrect ? 'status-correct' : 'status-incorrect'}">
          <div class="status-icon-circle">
            {#if isCorrect}
              <svg viewBox="0 0 24 24" class="icon-svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            {:else}
              <svg viewBox="0 0 24 24" class="icon-svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            {/if}
          </div>
          <h1 class="outcome-title">{isCorrect ? 'Correct' : 'Incorrect'}</h1>
          <span class="points-earned font-mono">{isCorrect ? `+${pointsGained} PTS` : '+0 PTS'}</span>
        </div>

        <!-- Detailed Breakdown Card -->
        <Card variant="filled" class="summary-card-override">
          <div class="summary-content">
            <div class="summary-section">
              <span class="summary-label">Prompt</span>
              <p class="summary-text-prompt">“{prompt}”</p>
            </div>

            <div class="summary-divider"></div>

            <div class="summary-section">
              <span class="summary-label">Correct Answer</span>
              <p class="summary-text-correct">“{correctAnswer}”</p>
            </div>

            {#if !isCorrect && selectedAnswer}
              <div class="summary-divider"></div>
              <div class="summary-section">
                <span class="summary-label">Your Guess</span>
                <p class="summary-text-wrong">“{selectedAnswer}”</p>
              </div>
            {/if}
          </div>
        </Card>
      </div>
    {/if}
  </main>

  <!-- Sleek Footer -->
  <footer class="play-footer">
    <span class="brand-text">BeatHop Lyric challenge</span>
  </footer>
</div>

<style>
  .play-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 1.25rem 1rem;
    box-sizing: border-box;
    font-family: var(--m3-font, system-ui);
    background-color: var(--m3c-surface);
    color: var(--m3c-on-surface);
  }

  .play-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--m3c-outline-variant);
    padding-bottom: 0.75rem;
    flex-shrink: 0;
  }

  .header-track-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex-grow: 1;
    margin-right: 1rem;
  }

  .category-label {
    @apply --m3-label-medium;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--m3c-secondary);
    font-weight: 700;
  }

  .track-title {
    @apply --m3-title-medium;
    font-weight: 700;
    margin: 0.15rem 0 0 0;
    color: var(--m3c-on-surface);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .score-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--m3c-secondary-container);
    color: var(--m3c-on-secondary-container);
    padding: 0.35rem 0.8rem;
    border-radius: var(--m3-shape-medium);
    box-shadow: var(--m3-elevation-1);
    flex-shrink: 0;
  }

  .score-label {
    @apply --m3-label-small;
    text-transform: uppercase;
    opacity: 0.8;
  }

  .score-value {
    @apply --m3-title-small;
    font-weight: 700;
    line-height: 1.1;
  }

  .play-main {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 1.5rem 0;
    min-height: 0;
    width: 100%;
  }

  /* LISTENING VIEW */
  .listening-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.25rem;
    width: 100%;
    max-width: 20rem;
  }

  .thumbnail-wrapper {
    width: 11rem;
    height: 11rem;
    border-radius: 50%;
    overflow: hidden;
    position: relative;
    border: 3px solid var(--m3c-outline-variant);
    background-color: var(--m3c-surface-container-high);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .thumbnail-placeholder {
    font-size: 3rem;
  }

  .pulsing-glow {
    box-shadow: 0 0 25px rgba(var(--m3c-primary-rgb), 0.15);
    animation: glowPulse 2s ease-in-out infinite alternate;
  }

  .status-msg {
    @apply --m3-title-medium;
    font-weight: 700;
    color: var(--m3c-on-surface);
    margin: 0;
  }

  .status-sub {
    @apply --m3-body-medium;
    color: var(--m3c-on-surface-variant);
    margin: 0;
  }

  .eq-visualizer {
    display: flex;
    align-items: flex-end;
    gap: 0.25rem;
    height: 2.25rem;
    margin-top: 0.5rem;
  }

  .eq-bar {
    width: 0.25rem;
    background-color: var(--m3c-primary);
    border-radius: var(--m3-shape-full);
    animation: audioWave 1.2s ease-in-out infinite alternate;
  }

  /* QUESTION VIEW */
  .question-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 25rem;
    gap: 1.25rem;
  }

  .banner-thumbnail-wrapper {
    position: relative;
    width: 100%;
    height: 5.5rem;
    border-radius: var(--m3-shape-large);
    overflow: hidden;
    border: 1px solid var(--m3c-outline-variant);
    box-shadow: var(--m3-elevation-1);
    flex-shrink: 0;
  }

  .banner-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .banner-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.5), transparent);
  }

  :global(.prompt-card-override) {
    background-color: var(--m3c-surface-container-low) !important;
    border-color: var(--m3c-outline-variant) !important;
    border-radius: var(--m3-shape-large) !important;
    padding: 1.25rem !important;
    box-shadow: var(--m3-elevation-1) !important;
  }

  .lyric-prompt {
    @apply --m3-title-medium;
    font-weight: 500;
    font-style: italic;
    text-align: center;
    color: var(--m3c-on-surface);
    margin: 0;
    line-height: 1.4;
  }

  .options-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  /* Tactile multiple choice option buttons styled with host TV grid colors */
  .opt-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 3.75rem;
    padding: 0.85rem 1.25rem;
    border-radius: var(--m3-shape-large);
    border: 2px solid transparent;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    outline: none;
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
  }

  .opt-btn:active {
    transform: scale(0.97);
  }

  .option-text {
    @apply --m3-title-small;
    font-weight: 700;
    line-clamp: 2;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Color 0: Rose (Red) */
  .opt-rose {
    background: linear-gradient(135deg, rgba(251, 113, 133, 0.12) 0%, rgba(225, 29, 72, 0.05) 100%);
    border-color: rgba(251, 113, 133, 0.3);
    color: #fda4af;
    text-shadow: 0 0 8px rgba(251, 113, 133, 0.25);
  }
  .opt-rose:hover {
    background: linear-gradient(135deg, rgba(251, 113, 133, 0.22) 0%, rgba(225, 29, 72, 0.1) 100%);
    border-color: rgba(251, 113, 133, 0.6);
    box-shadow: 0 0 12px rgba(251, 113, 133, 0.15);
  }

  /* Color 1: Blue */
  .opt-blue {
    background: linear-gradient(135deg, rgba(96, 165, 250, 0.12) 0%, rgba(37, 99, 235, 0.05) 100%);
    border-color: rgba(96, 165, 250, 0.3);
    color: #93c5fd;
    text-shadow: 0 0 8px rgba(96, 165, 250, 0.25);
  }
  .opt-blue:hover {
    background: linear-gradient(135deg, rgba(96, 165, 250, 0.22) 0%, rgba(37, 99, 235, 0.1) 100%);
    border-color: rgba(96, 165, 250, 0.6);
    box-shadow: 0 0 12px rgba(96, 165, 250, 0.15);
  }

  /* Color 2: Green */
  .opt-green {
    background: linear-gradient(135deg, rgba(52, 211, 153, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%);
    border-color: rgba(52, 211, 153, 0.3);
    color: #a7f3d0;
    text-shadow: 0 0 8px rgba(52, 211, 153, 0.25);
  }
  .opt-green:hover {
    background: linear-gradient(135deg, rgba(52, 211, 153, 0.22) 0%, rgba(5, 150, 105, 0.1) 100%);
    border-color: rgba(52, 211, 153, 0.6);
    box-shadow: 0 0 12px rgba(52, 211, 153, 0.15);
  }

  /* Color 3: Amber (Yellow) */
  .opt-amber {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%);
    border-color: rgba(251, 191, 36, 0.3);
    color: #fde68a;
    text-shadow: 0 0 8px rgba(251, 191, 36, 0.25);
  }
  .opt-amber:hover {
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.22) 0%, rgba(217, 119, 6, 0.1) 100%);
    border-color: rgba(251, 191, 36, 0.6);
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.15);
  }

  /* ANSWERED VIEW */
  .answered-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
    max-width: 20rem;
    gap: 1rem;
  }

  .loader-container {
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .submitted-answer-capsule {
    width: 100%;
    padding: 1.25rem;
    border-radius: var(--m3-shape-large);
    margin-top: 1.5rem;
    border: 1px solid rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    animation: lockPulse 2s ease-in-out infinite alternate;
  }

  .submitted-label {
    @apply --m3-label-medium;
    text-transform: uppercase;
    opacity: 0.7;
    font-weight: 700;
  }

  .submitted-text {
    @apply --m3-title-small;
    font-weight: 600;
    margin: 0;
    font-style: italic;
  }

  /* OUTCOME VIEW */
  .outcome-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 25rem;
    gap: 1.5rem;
    align-items: center;
  }

  .outcome-status-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.5rem;
  }

  .status-icon-circle {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--m3-elevation-2);
  }

  .icon-svg {
    width: 2.25rem;
    height: 2.25rem;
    fill: currentColor;
  }

  .status-correct .status-icon-circle {
    background-color: rgba(16, 185, 129, 0.15);
    color: #34d399;
    border: 2px solid rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.25);
  }
  
  .status-correct .outcome-title {
    color: #34d399;
    text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
  }

  .status-incorrect .status-icon-circle {
    background-color: rgba(244, 63, 94, 0.15);
    color: #fb7185;
    border: 2px solid rgba(244, 63, 94, 0.4);
    box-shadow: 0 0 20px rgba(244, 63, 94, 0.25);
  }

  .status-incorrect .outcome-title {
    color: #fb7185;
    text-shadow: 0 0 10px rgba(244, 63, 94, 0.2);
  }

  .outcome-title {
    @apply --m3-headline-small;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0.5rem 0 0 0;
  }

  .points-earned {
    @apply --m3-title-medium;
    font-weight: 700;
  }

  :global(.summary-card-override) {
    background-color: var(--m3c-surface-container-low) !important;
    border-color: var(--m3c-outline-variant) !important;
    border-radius: var(--m3-shape-large) !important;
    width: 100%;
    box-shadow: var(--m3-elevation-1) !important;
  }

  .summary-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
  }

  .summary-section {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .summary-label {
    @apply --m3-label-small;
    text-transform: uppercase;
    color: var(--m3c-on-surface-variant);
    opacity: 0.7;
    font-weight: 700;
  }

  .summary-text-prompt {
    @apply --m3-body-medium;
    font-style: italic;
    color: var(--m3c-on-surface-variant);
    margin: 0;
  }

  .summary-text-correct {
    @apply --m3-title-small;
    font-weight: 700;
    color: #34d399;
    margin: 0;
  }

  .summary-text-wrong {
    @apply --m3-body-medium;
    font-weight: 600;
    color: #fb7185;
    text-decoration: line-through;
    opacity: 0.8;
    margin: 0;
  }

  .summary-divider {
    height: 1px;
    background-color: var(--m3c-outline-variant);
    opacity: 0.5;
  }

  /* FOOTER */
  .play-footer {
    display: flex;
    justify-content: center;
    align-items: center;
    border-top: 1px solid var(--m3c-outline-variant);
    padding-top: 0.75rem;
    flex-shrink: 0;
  }

  .brand-text {
    @apply --m3-label-small;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    opacity: 0.4;
    font-family: monospace;
  }

  /* Animations */
  .animate-fade-in {
    animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes audioWave {
    from { transform: scaleY(0.4); }
    to { transform: scaleY(1); }
  }

  @keyframes glowPulse {
    from { box-shadow: 0 0 15px rgba(var(--m3c-primary-rgb), 0.1); }
    to { box-shadow: 0 0 30px rgba(var(--m3c-primary-rgb), 0.3); }
  }

  @keyframes lockPulse {
    from { border-color: rgba(255, 255, 255, 0.05); }
    to { border-color: var(--m3c-outline-variant); }
  }
</style>
