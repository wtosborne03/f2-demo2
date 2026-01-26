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
  let isArmed = false;
  let isLaunched = false;

  function selectLocation(id: string) {
    if (isLaunched) return;
    selected_location_id = id;
    isArmed = true;
  }

  function submit_prompt() {
    if (!selected_location_id || isLaunched) return;
    isLaunched = true;

    setTimeout(() => {
      gameClient.sendInput({
        type: "bunkerSelect",
        answer: selected_location_id,
      });
    }, 800);
  }

  // Get icon based on location type
  function getLocationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      city: "mdi:city",
      military: "mdi:tank",
      industrial: "mdi:factory",
      government: "mdi:bank",
      port: "mdi:ferry",
      airport: "mdi:airplane",
      power: "mdi:lightning-bolt",
      default: "mdi:map-marker",
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

<div class="launch-control">
  <!-- Animated Background -->
  <div class="bg-effects">
    <div class="radar-sweep"></div>
    <div class="grid-overlay"></div>
    <div class="scanline"></div>
  </div>

  <!-- Header Section -->
  <header class="control-header" in:fade={{ delay: 200, duration: 400 }}>
    <div class="status-indicator" class:armed={isArmed}>
      <div class="status-light"></div>
      <span class="status-text"
        >{isArmed ? "TARGET LOCKED" : "AWAITING TARGET"}</span
      >
    </div>
    <h1 class="header-title">SELECT TARGET ZONE</h1>
  </header>

  <!-- Targets List -->
  <div class="targets-container" in:fly={{ y: 30, duration: 500, delay: 300 }}>
    <div class="targets-list">
      {#if m_data?.locations}
        {#each m_data.locations as location, i}
          <button
            class="target-card"
            class:selected={selected_location_id === location.id}
            class:disabled={isLaunched}
            on:click={() => selectLocation(location.id)}
            in:fly={{ x: -50, duration: 400, delay: 400 + i * 100 }}
          >
            <div class="target-glow"></div>
            <div class="target-content">
              <div class="target-icon-wrapper">
                {#if location.thumbnail}
                  <img
                    src={location.thumbnail}
                    alt={location.name}
                    class="target-thumbnail"
                  />
                {:else}
                  <Icon
                    icon={location.icon || getLocationIcon(location.type)}
                    class="target-icon"
                  />
                {/if}
              </div>
              <div class="target-info">
                <span class="target-name">{location.name}</span>
                {#if location.address}
                  <span class="target-address">{location.address}</span>
                {/if}
                <span class="target-type"
                  >{location.type?.toUpperCase() || "LOCATION"}</span
                >
              </div>
              <div class="target-crosshair">
                <Icon icon="mdi:crosshairs-gps" class="crosshair-icon" />
              </div>
            </div>
            {#if selected_location_id === location.id}
              <div
                class="selected-indicator"
                in:scale={{ duration: 300, easing: elasticOut }}
              >
                <Icon icon="mdi:target" />
              </div>
            {/if}
          </button>
        {/each}
      {:else}
        <div class="no-targets">
          <Icon icon="mdi:radar" class="radar-icon spin" />
          <p>SCANNING FOR TARGETS...</p>
        </div>
      {/if}
    </div>
  </div>

  <!-- Launch Button Section -->
  <div class="launch-section" in:fly={{ y: 50, duration: 500, delay: 500 }}>
    <button
      class="launch-button"
      class:armed={isArmed && !isLaunched}
      class:launched={isLaunched}
      disabled={!isArmed || isLaunched}
      on:click={submit_prompt}
    >
      <div class="button-ring outer"></div>
      <div class="button-ring inner"></div>
      <div class="button-core">
        {#if isLaunched}
          <Icon icon="mdi:rocket-launch" class="launch-icon" />
        {:else if isArmed}
          <Icon icon="mdi:nuke" class="launch-icon" />
        {:else}
          <Icon icon="mdi:lock" class="launch-icon" />
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

  .launch-control {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100dvh;
    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%);
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

  .radar-sweep {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(255, 50, 50, 0.05) 30deg,
      transparent 60deg
    );
    animation: radar-spin 8s linear infinite;
  }

  @keyframes radar-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(
        rgba(255, 50, 50, 0.03) 1px,
        transparent 1px
      ),
      linear-gradient(90deg, rgba(255, 50, 50, 0.03) 1px, transparent 1px);
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
      rgba(255, 50, 50, 0.3),
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

  /* Warning Banner */
  .warning-banner {
    background: repeating-linear-gradient(
      45deg,
      #1a1a1a,
      #1a1a1a 10px,
      #252525 10px,
      #252525 20px
    );
    border-bottom: 2px solid #ff3333;
    padding: 8px 16px;
    position: relative;
    z-index: 10;
  }

  .warning-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .warning-text {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #ff5555;
    text-shadow: 0 0 10px rgba(255, 50, 50, 0.5);
  }

  :global(.warning-icon) {
    font-size: 6rem;
    color: #ffcc00;
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

  .status-indicator.armed {
    background: rgba(255, 50, 50, 0.15);
    border-color: rgba(255, 50, 50, 0.5);
  }

  .status-light {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #666;
    box-shadow: 0 0 10px rgba(100, 100, 100, 0.5);
    transition: all 0.3s ease;
  }

  .status-indicator.armed .status-light {
    background: #ff3333;
    box-shadow: 0 0 15px rgba(255, 50, 50, 0.8);
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

  .status-indicator.armed .status-text {
    color: #ff5555;
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

  .header-subtitle {
    font-family: "Share Tech Mono", monospace;
    font-size: 0.65rem;
    letter-spacing: 0.2em;
    color: #666;
    margin-top: 4px;
  }

  /* Targets Container */
  .targets-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px 16px;
    position: relative;
    z-index: 10;
    -webkit-overflow-scrolling: touch;
  }

  .targets-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* Target Card */
  .target-card {
    position: relative;
    background: linear-gradient(
      135deg,
      rgba(30, 30, 40, 0.9) 0%,
      rgba(20, 20, 30, 0.95) 100%
    );
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    text-align: left;
  }

  .target-card:active {
    transform: scale(0.98);
  }

  .target-card:hover:not(.disabled) {
    border-color: rgba(255, 100, 100, 0.3);
    transform: translateX(4px);
  }

  .target-card.selected {
    background: linear-gradient(
      135deg,
      rgba(255, 50, 50, 0.15) 0%,
      rgba(200, 30, 30, 0.1) 100%
    );
    border-color: rgba(255, 50, 50, 0.6);
    box-shadow:
      0 0 20px rgba(255, 50, 50, 0.2),
      inset 0 0 30px rgba(255, 50, 50, 0.05);
  }

  .target-card.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .target-glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 50, 50, 0.5),
      transparent
    );
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .target-card.selected .target-glow {
    opacity: 1;
  }

  .target-content {
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
    z-index: 1;
  }

  .target-icon-wrapper {
    width: 4rem;
    height: 4rem;
    border-radius: 10px;
    background: linear-gradient(
      135deg,
      rgba(255, 100, 100, 0.15) 0%,
      rgba(255, 50, 50, 0.05) 100%
    );
    border: 1px solid rgba(255, 100, 100, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .target-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }

  :global(.target-icon) {
    font-size: 1.4rem;
    color: #ff6666;
  }

  .target-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .target-name {
    font-size: 0.95rem;
    font-weight: 700;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .target-address {
    font-size: 1rem;
    color: #aa8888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: "Share Tech Mono", monospace;
  }

  .target-type {
    font-family: "Share Tech Mono", monospace;
    font-size: 0.85rem;
    letter-spacing: 0.15em;
    color: #888;
  }

  .target-crosshair {
    opacity: 0.3;
    transition: opacity 0.3s ease;
  }

  .target-card.selected .target-crosshair {
    opacity: 1;
  }

  :global(.crosshair-icon) {
    font-size: 2.5rem;
    color: #ff5555;
  }

  .target-card.selected :global(.crosshair-icon) {
    animation: pulse-target 1s ease-in-out infinite;
  }

  @keyframes pulse-target {
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
    background: rgba(255, 50, 50, 0.9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.9rem;
    box-shadow: 0 0 15px rgba(255, 50, 50, 0.6);
  }

  /* No Targets State */
  .no-targets {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 16px;
    color: #666;
  }

  :global(.radar-icon) {
    font-size: 3rem;
    color: #ff5555;
  }

  :global(.radar-icon.spin) {
    animation: spin 2s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  .no-targets p {
    font-family: "Share Tech Mono", monospace;
    font-size: 0.8rem;
    letter-spacing: 0.15em;
  }

  /* Launch Section */
  .launch-section {
    padding: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    position: relative;
    z-index: 10;
    background: linear-gradient(
      0deg,
      rgba(10, 10, 15, 0.95) 0%,
      transparent 100%
    );
  }

  .launch-button {
    position: relative;
    width: 6rem;
    height: 6rem;
    border-radius: 50%;
    background: #1a1a1a;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .launch-button:disabled {
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

  .launch-button.armed .button-ring.outer {
    border-color: rgba(255, 50, 50, 0.6);
    animation: ring-pulse 1.5s ease-in-out infinite;
  }

  .launch-button.armed .button-ring.inner {
    border-color: rgba(255, 50, 50, 0.8);
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

  .launch-button.armed .button-core {
    background: linear-gradient(135deg, #4a1515 0%, #2a0a0a 100%);
    box-shadow:
      inset 0 2px 10px rgba(0, 0, 0, 0.5),
      0 0 30px rgba(255, 50, 50, 0.4);
  }

  .launch-button.launched .button-core {
    background: linear-gradient(135deg, #1a4a1a 0%, #0a2a0a 100%);
  }

  :global(.launch-icon) {
    font-size: 2.8rem;
    color: #666;
    transition: all 0.3s ease;
  }

  .launch-button.armed :global(.launch-icon) {
    color: #ff5555;
    animation: glow-icon 1s ease-in-out infinite;
  }

  .launch-button.launched :global(.launch-icon) {
    color: #55ff55;
    animation: launch-fly 0.8s ease-out;
  }

  @keyframes glow-icon {
    0%,
    100% {
      filter: drop-shadow(0 0 5px rgba(255, 50, 50, 0.5));
    }
    50% {
      filter: drop-shadow(0 0 15px rgba(255, 50, 50, 0.8));
    }
  }

  @keyframes launch-fly {
    0% {
      transform: translateY(0) scale(1);
    }
    50% {
      transform: translateY(-10px) scale(1.1);
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }

  .button-core span {
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    color: #666;
    transition: color 0.3s ease;
  }

  .launch-button.armed .button-core span {
    color: #ff7777;
  }

  .launch-button.launched .button-core span {
    color: #77ff77;
  }

  .launch-warning {
    font-family: "Share Tech Mono", monospace;
    font-size: 0.7rem;
    letter-spacing: 0.1em;
    color: #ff6666;
    animation: flash-warning 1s ease-in-out infinite;
  }

  @keyframes flash-warning {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  /* Scrollbar Styling */
  .targets-container::-webkit-scrollbar {
    width: 4px;
  }

  .targets-container::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 2px;
  }

  .targets-container::-webkit-scrollbar-thumb {
    background: rgba(255, 50, 50, 0.3);
    border-radius: 2px;
  }

  .targets-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 50, 50, 0.5);
  }
</style>
