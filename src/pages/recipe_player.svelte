<script lang="ts">
  import { get } from "svelte/store";
  import { gameState, gameClient } from "$lib/wsapi/gameClient";
  import { fly, fade, scale } from "svelte/transition";
  import { elasticOut, cubicOut } from "svelte/easing";
  import Icon from "@iconify/svelte";
  import { onMount, afterUpdate } from "svelte";

  // Data Types
  interface RecipeStep {
    label: string;
    index: number;
    color: string;
    status?: "correct" | "wrong"; // Updated from host code
  }

  // Safelist for Tailwind to pick up dynamic classes from server
  const _safelist = [
    "bg-red-400",
    "bg-orange-400",
    "bg-amber-400",
    "bg-yellow-400",
    "bg-lime-400",
    "bg-green-400",
    "bg-emerald-400",
    "bg-teal-400",
    "bg-cyan-400",
    "bg-sky-400",
    "bg-blue-400",
    "bg-indigo-400",
    "bg-violet-400",
    "bg-purple-400",
    "bg-fuchsia-400",
    "bg-pink-400",
    "bg-rose-400",
    "bg-slate-400",
    "bg-gray-400",
    "bg-zinc-400",
    "bg-neutral-400",
    "bg-stone-400",
  ];

  interface RecipePageData {
    recipeName: string;
    mySteps: RecipeStep[];
  }

  // Reactive State
  $: m_data = $gameState.page_data as RecipePageData;
  $: console.log(m_data, "m_data");
  $: mySteps = m_data?.mySteps || [];
  $: recipeName = m_data?.recipeName || "Prepare Order";
  $: score = $gameState.score || 0;

  // Local State
  let lastClickedStep: number | null = null;
  let lastRecipeName: string = "";
  let isShaking = false;
  let feedbackMessage: string | null = null;
  let feedbackType: "success" | "error" | null = null;

  // React to status changes for sound/feedback
  let prevStepsStatus: Record<number, string | undefined> = {};

  $: {
    // Reset if recipe changes
    if (recipeName !== lastRecipeName) {
      lastRecipeName = recipeName;
      lastClickedStep = null;
      prevStepsStatus = {};
    }

    mySteps.forEach((step) => {
      const prev = prevStepsStatus[step.index];
      if (step.status !== prev) {
        if (step.status === "correct") {
          showFeedback("Tasty!", "success");
          lastClickedStep = null; // Clear waiting state
        } else if (step.status === "wrong") {
          showFeedback("Yuck!", "error");
          isShaking = true;
          setTimeout(() => (isShaking = false), 500);
          lastClickedStep = null; // Clear waiting state
        }
        prevStepsStatus[step.index] = step.status;
      }
    });
  }

  function showFeedback(msg: string, type: "success" | "error") {
    feedbackMessage = msg;
    feedbackType = type;
    setTimeout(() => {
      feedbackMessage = null;
      feedbackType = null;
    }, 1000);
  }

  function handleStepClick(step: RecipeStep) {
    if (step.status === "correct" || lastClickedStep !== null) return;

    lastClickedStep = step.index;

    // Safety timeout: if server doesn't respond in 1s, unlock
    setTimeout(() => {
      if (lastClickedStep === step.index) {
        lastClickedStep = null;
      }
    }, 1000);

    // Optimistic UI handled by loading spinner, actual confirmation comes from 'status' prop

    gameClient.sendInput({
      type: "stepClick",
      stepIndex: step.index,
      playerName: $gameState.name,
    });
  }
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Chewy&family=Fredoka:wght@400;600&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="kitchen-display">
  <!-- Header -->
  <header class="header" in:fly={{ y: -20, duration: 400 }}>
    <div class="header-content">
      <h1 class="recipe-name">{recipeName}</h1>
      <div class="score-pill">
        <Icon icon="mdi:star-face" color="#FFD700" width="24" />
        <span>{score}</span>
      </div>
    </div>
  </header>

  <!-- Feedback Overlay -->
  {#if feedbackMessage}
    <div
      class="feedback-pop"
      class:success={feedbackType === "success"}
      class:error={feedbackType === "error"}
      transition:scale={{ duration: 300, easing: elasticOut }}
    >
      <Icon
        icon={feedbackType === "success"
          ? "mdi:emoticon-happy-outline"
          : "mdi:emoticon-poop"}
        style="font-size: 3rem;"
      />
      <span>{feedbackMessage}</span>
    </div>
  {/if}

  <!-- Main List -->
  <main class="content" class:shake={isShaking}>
    {#if mySteps.length > 0}
      <div class="cards-grid">
        {#each mySteps as step, i (step.index)}
          <button
            class={`ingredient-card ${step.color}`}
            class:correct={step.status === "correct"}
            class:wrong={step.status === "wrong"}
            class:waiting={lastClickedStep === step.index}
            on:click={() => handleStepClick(step)}
            disabled={step.status === "correct" || lastClickedStep !== null}
            in:scale={{ delay: i * 50, duration: 300, easing: elasticOut }}
          >
            <div class="card-inner">
              <span class="step-label">{step.label}</span>

              <div class="icon-area">
                {#if step.status === "correct"}
                  <div class="status-icon success" in:scale>
                    <Icon icon="mdi:check-bold" />
                  </div>
                {:else if step.status === "wrong"}
                  <div class="status-icon error" in:scale>
                    <Icon icon="mdi:close-thick" />
                  </div>
                {:else if lastClickedStep === step.index}
                  <div class="status-icon waiting">
                    <Icon icon="mdi:loading" class="spin" />
                  </div>
                {:else}{/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    {:else}
      <div class="empty-state" in:fade>
        <div class="bouncing-chef">👨‍🍳</div>
        <p>Waiting for orders...</p>
      </div>
    {/if}
  </main>
</div>

<style>
  body {
    margin: 0;
    background: #dbd8cb;
    font-family: "Fredoka", sans-serif;
  }

  .kitchen-display {
    width: 100vw;
    height: 100dvh;
    background-color: #fff8e1;
    background-image: radial-gradient(#ffd54f 2px, transparent 2px);
    background-size: 30px 30px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Header */
  .header {
    background: #ffffff;
    padding: 15px 20px;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.1);
    z-index: 10;
    border-bottom: 2px solid #ffe082;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
  }

  .recipe-name {
    margin: 0;
    font-size: 1.8rem;
    color: #5d4037;
    font-family: "Chewy", cursive;
    letter-spacing: 1px;
  }

  .score-pill {
    background: #3e2723;
    color: white;
    padding: 5px 15px;
    border-radius: 50px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;
    font-size: 1.2rem;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.2);
  }

  /* Content */
  .content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 15px;
    width: 100%;
    max-width: 600px;
    align-content: center;
  }

  /* Ingredient Card */
  .ingredient-card {
    aspect-ratio: 1;
    border: none;
    border-radius: 20px;
    padding: 0;
    cursor: pointer;
    position: relative;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 6px 0 rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
  }

  .card-inner {
    flex: 1;
    width: 100%;
    padding: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .ingredient-card:active:not(:disabled) {
    transform: translateY(6px);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0.15);
  }

  .step-label {
    font-family: "Chewy", cursive;
    font-size: 1.5rem;
    color: #000000;
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
    line-height: 1.1;
    word-break: break-word;
    text-align: center;
  }

  .icon-area {
    margin-top: 10px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .step-number {
    background: rgba(255, 255, 255, 0.3);
    color: white;
    font-weight: bold;
    padding: 4px 10px;
    border-radius: 10px;
    font-size: 0.9rem;
  }

  /* States */
  .ingredient-card.waiting {
    opacity: 0.8;
    transform: scale(0.95);
  }

  .ingredient-card.correct {
    cursor: default;
    transform: translateY(6px);
    box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .ingredient-card.wrong {
    animation: wobble 0.5s ease-in-out;
  }

  @keyframes wobble {
    0%,
    100% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(-5deg);
    }
    75% {
      transform: rotate(5deg);
    }
  }

  .status-icon {
    font-size: 2rem;
    color: white;
    filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.1));
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Empty State */
  .empty-state {
    margin-top: 20%;
    text-align: center;
    color: #8d6e63;
    font-size: 1.2rem;
  }

  .bouncing-chef {
    font-size: 4rem;
    margin-bottom: 10px;
    animation: bounce 2s infinite;
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }

  /* Feedback Pop */
  .feedback-pop {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px 40px;
    border-radius: 30px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    font-family: "Chewy", cursive;
    font-size: 2rem;
    pointer-events: none;
    border: 4px solid;
  }

  .feedback-pop.success {
    color: #66bb6a;
    border-color: #66bb6a;
    transform: translate(-50%, -50%) rotate(-5deg);
  }

  .feedback-pop.error {
    color: #ef5350;
    border-color: #ef5350;
    transform: translate(-50%, -50%) rotate(5deg);
  }

  .shake {
    animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  @keyframes shake {
    10%,
    90% {
      transform: translate3d(-1px, 0, 0);
    }
    20%,
    80% {
      transform: translate3d(2px, 0, 0);
    }
    30%,
    50%,
    70% {
      transform: translate3d(-3px, 0, 0);
    }
    40%,
    60% {
      transform: translate3d(3px, 0, 0);
    }
  }
</style>
