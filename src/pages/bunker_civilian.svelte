<script lang="ts">
  import { get } from "svelte/store";
  import type { PlayerState } from "../types/player_state";
  import type {
    bunkerData,
    PromptData,
    PointOfInterest,
  } from "../types/page_data";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import type { PlayerInputPayload } from "$lib/wsapi/game";
  import Icon from "@iconify/svelte";
  import { fly, fade, scale } from "svelte/transition";
  import { elasticOut } from "svelte/easing";

  let m_data: bunkerData;
  m_data = get(gameState).page_data;

  let selected_location_id = "";
  let isReady = false;
  let isConfirmed = false;

  function selectLocation(id: string) {
    if (isConfirmed) return;
    selected_location_id = id;
    isReady = true;
  }

  function submit_prompt() {
    if (!selected_location_id || isConfirmed) return;
    isConfirmed = true;

    setTimeout(() => {
      gameClient.sendInput({
        type: "bunkerSelect",
        answer: selected_location_id,
      });
    }, 800);
  }

  // Get icon based on shelter type
  function getShelterIcon(type: string): string {
    const iconMap: Record<string, string> = {
      bunker: "mdi:bunker",
      subway: "mdi:subway",
      basement: "mdi:home-floor-negative-1",
      cave: "mdi:terrain",
      underground: "mdi:tunnel",
      shelter: "mdi:shield-home",
      vault: "mdi:safe-square",
      default: "mdi:shield-home-outline",
    };
    return iconMap[type] || iconMap.default;
  }
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="shelter-control">
  <!-- Animated Background -->
  <div class="bg-effects">
    <div class="pulse-wave"></div>
    <div class="grid-overlay"></div>
    <div class="scanline"></div>
  </div>

  <!-- Header Section -->
  <header class="control-header" in:fade={{ delay: 200, duration: 400 }}>
    <div class="status-indicator" class:ready={isReady}>
      <div class="status-light"></div>
      <span class="status-text"
        >{isReady ? "SHELTER SELECTED" : "SELECT SHELTER"}</span
      >
    </div>
    <h1 class="header-title">CHOOSE YOUR SHELTER</h1>
  </header>

  <!-- Shelters List -->
  <div class="shelters-container" in:fly={{ y: 30, duration: 500, delay: 300 }}>
    <div class="shelters-list">
      {#if m_data?.locations}
        {#each m_data.locations as location, i}
          <button
            class="shelter-card"
            class:selected={selected_location_id === location.id}
            class:disabled={isConfirmed}
            on:click={() => selectLocation(location.id)}
            in:fly={{ x: -50, duration: 400, delay: 400 + i * 100 }}
          >
            <div class="shelter-glow"></div>
            <div class="shelter-content">
              <div class="shelter-icon-wrapper">
                {#if location.thumbnail}
                  <img
                    src={location.thumbnail}
                    alt={location.name}
                    class="shelter-thumbnail"
                  />
                {:else}
                  <Icon
                    icon={location.icon || getShelterIcon(location.type)}
                    class="shelter-icon"
                  />
                {/if}
              </div>
              <div class="shelter-info">
                <span class="shelter-name">{location.name}</span>
                {#if location.address}
                  <span class="shelter-address">{location.address}</span>
                {/if}
                <span class="shelter-type"
                  >{location.type?.toUpperCase() || "SHELTER"}</span
                >
              </div>
              <div class="shelter-shield">
                <Icon icon="mdi:shield-check" class="shield-icon" />
              </div>
            </div>
            {#if selected_location_id === location.id}
              <div
                class="selected-indicator"
                in:scale={{ duration: 300, easing: elasticOut }}
              >
                <Icon icon="mdi:check-bold" />
              </div>
            {/if}
          </button>
        {/each}
      {:else}
        <div class="no-shelters">
          <Icon icon="mdi:map-search" class="search-icon pulse" />
          <p>LOCATING SHELTERS...</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Confirm Button Section -->
  <div class="confirm-section" in:fly={{ y: 50, duration: 500, delay: 500 }}>
    <button
      class="confirm-button"
      class:ready={isReady && !isConfirmed}
      class:confirmed={isConfirmed}
      disabled={!isReady || isConfirmed}
      on:click={submit_prompt}
    >
      <div class="button-ring outer"></div>
      <div class="button-ring inner"></div>
      <div class="button-core">
        {#if isConfirmed}
          <Icon icon="mdi:run-fast" class="confirm-icon" />
        {:else if isReady}
          <Icon icon="mdi:shield-check" class="confirm-icon" />
        {:else}
          <Icon icon="mdi:shield-off-outline" class="confirm-icon" />
        {/if}
      </div>
    </button>
  </div>
</div>

<style>
  :global(.font-orbitron) {
    font-family: "Orbitron", sans-serif;
  }

  :global(.font-tech) {
    font-family: "Share Tech Mono", monospace;
  }

  .shelter-control {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100dvh;
    background: linear-gradient(135deg, #0a0f14 0%, #0f1a2e 50%, #0a1020 100%);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: "Orbitron", sans-serif;
    color: #e0e0e0;
    padding-top: 6.5rem;
  }

  /* Background Effects */
  .bg-effects {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .pulse-wave {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 150%;
    height: 150%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      transparent 0%,
      transparent 40%,
      rgba(255, 180, 50, 0.03) 50%,
      transparent 60%
    );
    animation: pulse-expand 4s ease-out infinite;
  }

  @keyframes pulse-expand {
    0% {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.5);
      opacity: 0;
    }
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
        rgba(50, 150, 255, 0.03) 1px,
        transparent 1px
      ),
      linear-gradient(90deg, rgba(50, 150, 255, 0.03) 1px, transparent 1px);
    background-size: 30px 30px;
  }

  .scanline {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(50, 150, 255, 0.3),
      transparent
    );
    animation: scan 3s linear infinite;
  }

  @keyframes scan {
    0% {
      top: 0;
      opacity: 1;
    }
    100% {
      top: 100%;
      opacity: 0.3;
    }
  }

  :global(.warning-icon) {
    font-size: 6rem;
    color: #ffaa00;
  }

  :global(.warning-icon.pulse) {
    animation: pulse-glow 1.5s ease-in-out infinite;
  }

  @keyframes pulse-glow {
    0%,
    100% {
      opacity: 0.5;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  /* Header */
  .control-header {
    padding: 9px;
    text-align: center;
    position: relative;
    z-index: 10;
  }

  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    margin-bottom: 12px;
    transition: all 0.3s ease;
  }

  .status-indicator.ready {
    background: rgba(50, 200, 100, 0.15);
    border-color: rgba(50, 200, 100, 0.5);
  }

  .status-light {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #666;
    box-shadow: 0 0 10px rgba(100, 100, 100, 0.5);
    transition: all 0.3s ease;
  }

  .status-indicator.ready .status-light {
    background: #33cc66;
    box-shadow: 0 0 15px rgba(50, 200, 100, 0.8);
    animation: blink 1s ease-in-out infinite;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  .status-text {
    font-family: "Share Tech Mono", monospace;
    font-size: 1rem;
    letter-spacing: 0.1em;
    color: #888;
    transition: color 0.3s ease;
  }

  .status-indicator.ready .status-text {
    color: #55dd77;
  }

  .header-title {
    font-size: 1.4rem;
    font-weight: 900;
    letter-spacing: 0.05em;
    background: linear-gradient(180deg, #ffffff 0%, #888888 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: none;
    margin: 0;
  }

  /* Shelters Container */
  .shelters-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px 16px;
    position: relative;
    z-index: 10;
    -webkit-overflow-scrolling: touch;
  }

  .shelters-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Shelter Card */
  .shelter-card {
    position: relative;
    background: linear-gradient(
      135deg,
      rgba(20, 30, 50, 0.9) 0%,
      rgba(15, 25, 40, 0.95) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    text-align: left;
  }

  .shelter-card:active {
    transform: scale(0.98);
  }

  .shelter-card:hover:not(.disabled) {
    border-color: rgba(50, 150, 255, 0.3);
    transform: translateX(4px);
  }

  .shelter-card.selected {
    background: linear-gradient(
      135deg,
      rgba(50, 200, 100, 0.15) 0%,
      rgba(30, 150, 80, 0.1) 100%
    );
    border-color: rgba(50, 200, 100, 0.6);
    box-shadow:
      0 0 20px rgba(50, 200, 100, 0.2),
      inset 0 0 30px rgba(50, 200, 100, 0.05);
  }

  .shelter-card.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .shelter-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(50, 200, 100, 0.5),
      transparent
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .shelter-card.selected .shelter-glow {
    opacity: 1;
  }

  .shelter-content {
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
    z-index: 1;
  }

  .shelter-icon-wrapper {
    width: 4rem;
    height: 4rem;
    border-radius: 10px;
    background: linear-gradient(
      135deg,
      rgba(50, 150, 255, 0.15) 0%,
      rgba(50, 100, 200, 0.05) 100%
    );
    border: 1px solid rgba(50, 150, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .shelter-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }

  :global(.shelter-icon) {
    font-size: 3rem;
    color: #55aaff;
  }

  .shelter-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .shelter-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .shelter-address {
    font-size: 1rem;
    color: #99aabb;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: "Share Tech Mono", monospace;
  }

  .shelter-type {
    font-family: "Share Tech Mono", monospace;
    font-size: 0.85rem;
    letter-spacing: 0.15em;
    color: #888;
  }

  .shelter-shield {
    opacity: 0.3;
    transition: opacity 0.3s ease;
  }

  .shelter-card.selected .shelter-shield {
    opacity: 1;
  }

  :global(.shield-icon) {
    font-size: 2.5rem;
    color: #55dd77;
  }

  .shelter-card.selected :global(.shield-icon) {
    animation: pulse-shield 1s ease-in-out infinite;
  }

  @keyframes pulse-shield {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0.7;
    }
  }

  .selected-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    background: rgba(50, 200, 100, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.9rem;
    box-shadow: 0 0 15px rgba(50, 200, 100, 0.6);
  }

  /* No Shelters State */
  .no-shelters {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 16px;
    color: #666;
  }

  :global(.search-icon) {
    font-size: 3rem;
    color: #55aaff;
  }

  :global(.search-icon.pulse) {
    animation: pulse-glow 2s linear infinite;
  }

  .no-shelters p {
    font-family: "Share Tech Mono", monospace;
    font-size: 0.8rem;
    letter-spacing: 0.15em;
  }

  /* Confirm Section */
  .confirm-section {
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    position: relative;
    z-index: 10;
    background: linear-gradient(
      0deg,
      rgba(10, 15, 25, 0.95) 0%,
      transparent 100%
    );
  }

  .confirm-button {
    position: relative;
    width: 6rem;
    height: 6rem;
    border-radius: 50%;
    background: #1a1a1a;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .confirm-button:disabled {
    cursor: not-allowed;
  }

  .button-ring {
    position: absolute;
    border-radius: 50%;
    border: 2px solid;
    transition: all 0.3s ease;
  }

  .button-ring.outer {
    inset: 0;
    border-color: #333;
  }

  .button-ring.inner {
    inset: 8px;
    border-color: #444;
  }

  .confirm-button.ready .button-ring.outer {
    border-color: rgba(50, 200, 100, 0.6);
    animation: ring-pulse 1.5s ease-in-out infinite;
  }

  .confirm-button.ready .button-ring.inner {
    border-color: rgba(50, 200, 100, 0.8);
  }

  @keyframes ring-pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.7;
    }
  }

  .button-core {
    position: absolute;
    inset: 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    box-shadow:
      inset 0 2px 10px rgba(0, 0, 0, 0.5),
      0 4px 20px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }

  .confirm-button.ready .button-core {
    background: linear-gradient(135deg, #154a20 0%, #0a2a10 100%);
    box-shadow:
      inset 0 2px 10px rgba(0, 0, 0, 0.5),
      0 0 30px rgba(50, 200, 100, 0.4);
  }

  .confirm-button.confirmed .button-core {
    background: linear-gradient(135deg, #1a3a4a 0%, #0a1a2a 100%);
  }

  :global(.confirm-icon) {
    font-size: 2.8rem;
    color: #666;
    transition: all 0.3s ease;
  }

  .confirm-button.ready :global(.confirm-icon) {
    color: #55dd77;
    animation: glow-icon 1s ease-in-out infinite;
  }

  .confirm-button.confirmed :global(.confirm-icon) {
    color: #55aaff;
    animation: run-anim 0.5s ease-out infinite;
  }

  @keyframes glow-icon {
    0%,
    100% {
      filter: drop-shadow(0 0 5px rgba(50, 200, 100, 0.5));
    }
    50% {
      filter: drop-shadow(0 0 15px rgba(50, 200, 100, 0.8));
    }
  }

  @keyframes run-anim {
    0% {
      transform: translateX(0);
    }
    50% {
      transform: translateX(5px);
    }
    100% {
      transform: translateX(0);
    }
  }

  .button-core span {
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #666;
    transition: color 0.3s ease;
  }

  .confirm-button.ready .button-core span {
    color: #77ff99;
  }

  .confirm-button.confirmed .button-core span {
    color: #77ccff;
  }

  /* Scrollbar Styling */
  .shelters-container::-webkit-scrollbar {
    width: 4px;
  }

  .shelters-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
  }

  .shelters-container::-webkit-scrollbar-thumb {
    background: rgba(50, 150, 255, 0.3);
    border-radius: 2px;
  }

  .shelters-container::-webkit-scrollbar-thumb:hover {
    background: rgba(50, 150, 255, 0.5);
  }
</style>
