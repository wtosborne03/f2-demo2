<script lang="ts">
  import Drink from "$lib/components/drink.svelte";
  import { get } from "svelte/store";
  import type { DrinkingPrompt } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button } from "m3-svelte";

  const m_data = $gameState.page_data as DrinkingPrompt;

  function confirm() {
    gameClient.sendPlayerInput("confirm");
  }

  // Generate 35 bubbles for the background with randomized styling properties
  const bubbles = Array.from({ length: 35 }, (_, i) => {
    const size = Math.random() * 10 + 4; // size from 4px to 14px
    return {
      id: i,
      left: Math.random() * 100,
      size,
      delay: Math.random() * 4,
      duration: Math.random() * 4 + 2, // 2s to 6s
      opacity: Math.random() * 0.4 + 0.3,
      sway: Math.random() * 30 - 15 // -15px to 15px
    };
  });
</script>

<div class="drink-page w-full flex flex-col justify-center items-center relative">
  <!-- Beer Background Fill-Up Effect -->
  <div class="beer-bg" aria-hidden="true">
    <div class="beer-liquid">
      <!-- Bubbles inside the liquid -->
      <div class="bubbles-container">
        {#each bubbles as b (b.id)}
          <div
            class="bubble"
            style="left: {b.left}%; width: {b.size}px; height: {b.size}px; animation-delay: -{b.delay}s; animation-duration: {b.duration}s; --bubble-opacity: {b.opacity}; --bubble-sway: {b.sway}px;"
          ></div>
        {/each}
      </div>
      
      <!-- Foam head at the top of the liquid -->
      <div class="beer-foam">
        <!-- Foam bubbles overlaying the top border -->
        <div class="foam-bumpy-container">
          <div class="foam-bump" style="left: -5%; width: 22%; height: 40px; animation-delay: 0.1s;"></div>
          <div class="foam-bump" style="left: 10%; width: 28%; height: 50px; animation-delay: 0.4s;"></div>
          <div class="foam-bump" style="left: 32%; width: 20%; height: 38px; animation-delay: 0.2s;"></div>
          <div class="foam-bump" style="left: 45%; width: 24%; height: 46px; animation-delay: 0.7s;"></div>
          <div class="foam-bump" style="left: 62%; width: 22%; height: 42px; animation-delay: 0.3s;"></div>
          <div class="foam-bump" style="left: 78%; width: 26%; height: 48px; animation-delay: 0.5s;"></div>
          <div class="foam-bump" style="left: 92%; width: 18%; height: 36px; animation-delay: 0.6s;"></div>
        </div>
        
        <!-- Surface bubbles floating dynamically on the foam -->
        <div class="foam-surface-bubble" style="left: 15%; top: -10px; width: 12px; height: 12px; animation-delay: 0.2s;"></div>
        <div class="foam-surface-bubble" style="left: 35%; top: -14px; width: 16px; height: 16px; animation-delay: 0.8s;"></div>
        <div class="foam-surface-bubble" style="left: 55%; top: -8px; width: 10px; height: 10px; animation-delay: 0.5s;"></div>
        <div class="foam-surface-bubble" style="left: 72%; top: -12px; width: 14px; height: 14px; animation-delay: 1.1s;"></div>
        <div class="foam-surface-bubble" style="left: 88%; top: -6px; width: 9px; height: 9px; animation-delay: 0.1s;"></div>
      </div>
    </div>
  </div>

  <Drink prompt={m_data.prompt} />

  {#if get(gameState).admin}
    <div
      class="card p-6 mt-8 w-full max-w-md mx-auto bg-white/80 dark:bg-gray-950/70 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-2xl flex flex-col gap-4 items-center text-center rounded-2xl z-10"
    >
      <div>
        <h3 class="h3 font-bold text-primary underline">Admin</h3>
        <p class="text-gray-800 dark:text-gray-200 mt-2 text-xl">
          Verify that all players have completed the drinking punishment.
        </p>
      </div>
      <div class="btn-wrapper">
        <Button variant="filled" onclick={confirm}>They drank 👍</Button>
      </div>
    </div>
  {/if}
</div>

<style>
  .drink-page {
    min-height: 100%;
    width: 100%;
    z-index: 1;
  }

  /* Target the main background wrapper for this page specifically */
  :global(#main-background:has(.drink-page)) {
    background-color: #201103 !important; /* Rich dark stout base */
    position: relative;
    overflow: hidden;
  }

  /* Beer background container */
  .beer-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -10;
    overflow: hidden;
    pointer-events: none;
  }

  /* Golden-Amber Beer Liquid */
  .beer-liquid {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    /* Rich beer color gradient: deep amber at the bottom, glowing gold at the top */
    background: linear-gradient(
      to top,
      #9e4700 0%,
      #d46a00 30%,
      #ff9f00 65%,
      #ffbf00 92%,
      #ffe16f 100%
    );
    transform: translateY(100%);
    animation: fill-up-beer 4s cubic-bezier(0.15, 0.85, 0.35, 1) forwards;
  }

  /* Rising animation for beer liquid */
  @keyframes fill-up-beer {
    0% {
      transform: translateY(100%);
    }
    100% {
      transform: translateY(22%); /* Beer fills up to 78% of the page */
    }
  }

  /* Bubbles Container */
  .bubbles-container {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  /* Individual bubble styling with glassy/glow gradients */
  .bubble {
    position: absolute;
    bottom: -20px;
    background: radial-gradient(
      circle at 30% 30%,
      rgba(255, 255, 255, 0.6) 0%,
      rgba(255, 255, 255, 0.1) 70%
    );
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.4),
                0 0 8px rgba(255, 220, 100, 0.2);
    animation: bubble-rise infinite linear;
    pointer-events: none;
  }

  /* Bubble rise and pop animation */
  @keyframes bubble-rise {
    0% {
      transform: translate3d(0, 0, 0) scale(0.6);
      opacity: 0;
    }
    10% {
      opacity: var(--bubble-opacity, 0.6);
    }
    90% {
      opacity: var(--bubble-opacity, 0.6);
    }
    100% {
      transform: translate3d(var(--bubble-sway, 15px), -102vh, 0) scale(1.1);
      opacity: 0;
    }
  }

  /* Fluffy Foam Head */
  .beer-foam {
    position: absolute;
    top: -20px; /* Offset to sit nicely on top edge of liquid */
    left: 0;
    right: 0;
    height: 40px;
    background: #fdfcf7;
    /* Soft border and glowing drop shadows to make foam look fluffy and illuminated */
    border-top: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 -8px 25px rgba(255, 255, 255, 0.95),
                inset 0 -8px 12px rgba(212, 106, 0, 0.18); /* Golden tint where liquid meets foam */
    z-index: 5;
  }

  /* Foam bump shapes to create fluffy cloud look */
  .foam-bumpy-container {
    position: absolute;
    top: -20px;
    left: 0;
    right: 0;
    height: 40px;
    z-index: -1;
  }

  .foam-bump {
    position: absolute;
    background: #fdfcf7;
    border-radius: 50%;
    box-shadow: 0 -4px 10px rgba(255, 255, 255, 0.8),
                inset 0 -6px 8px rgba(212, 106, 0, 0.08);
    animation: foam-wiggle 3s ease-in-out infinite alternate;
  }

  @keyframes foam-wiggle {
    0% {
      transform: translateY(0) scale(1);
    }
    100% {
      transform: translateY(-4px) scale(1.04);
    }
  }

  /* Static/Drifting bubbles on foam surface */
  .foam-surface-bubble {
    position: absolute;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.95);
    border-radius: 50%;
    box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.9),
                0 2px 5px rgba(0, 0, 0, 0.05);
    z-index: 6;
    animation: foam-bubble-drift 5s ease-in-out infinite alternate;
  }

  @keyframes foam-bubble-drift {
    0% {
      transform: translate3d(0, 0, 0);
    }
    100% {
      transform: translate3d(4px, -3px, 0);
    }
  }

  .btn-wrapper {
    width: 100%;
  }
  .btn-wrapper > :global(*) {
    width: 100%;
    padding: 1.25rem 0;
    font-size: 1.25rem;
    font-weight: bold;
    background-color: #e65100 !important; /* Warm matching amber-orange button */
    color: white !important;
  }
</style>
