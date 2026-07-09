<script lang="ts">
  import { gameState } from "$lib/wsapi/gameClient";
  import { LoadingIndicator, Card } from "m3-svelte";
</script>

<div class="wait-container">
  <Card variant="filled" class="wait-card-override">
    <div class="wait-card-content">
      <!-- Rotating Vinyl Disc Visualizer -->
      <div class="vinyl-wrapper">
        <div class="vinyl-record">
          <div class="vinyl-grooves"></div>
          <div class="vinyl-center">
            <span class="vinyl-icon">🎵</span>
          </div>
        </div>
        <!-- Floating notes -->
        <div class="floating-note note-1">♫</div>
        <div class="floating-note note-2">♬</div>
        <div class="floating-note note-3">♩</div>
      </div>

      <h1 class="wait-title">Waiting for Song Selector</h1>

      {#if $gameState.page_data?.selectorName}
        <div class="selector-badge">
          <span class="selector-name">{$gameState.page_data.selectorName}</span>
        </div>
      {/if}
    </div>
  </Card>
</div>

<style>
  .wait-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 1.5rem;
    box-sizing: border-box;
    font-family: var(--m3-font, system-ui);
    background-color: var(--m3c-surface);
  }

  /* Target inside of Card container */
  :global(.wait-card-override) {
    width: 100%;
    max-width: 22rem !important;
    background-color: var(--m3c-surface-container-high) !important;
    border-radius: var(--m3-shape-extra-large) !important;
    border: 1px solid var(--m3c-outline-variant) !important;
    box-shadow: var(--m3-elevation-2) !important;
  }

  .wait-card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 2.5rem 1.5rem;
    gap: 1.5rem;
  }

  /* Vinyl Record Animation */
  .vinyl-wrapper {
    position: relative;
    width: 8rem;
    height: 8rem;
    margin-bottom: 0.5rem;
  }

  .vinyl-record {
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, #2d2a37 0%, #0c0a12 100%);
    border-radius: 50%;
    position: relative;
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.5),
      0 0 0 6px rgba(255, 255, 255, 0.03);
    animation: spin 4s linear infinite;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .vinyl-grooves {
    position: absolute;
    inset: 10px;
    border-radius: 50%;
    border: 1px double rgba(255, 255, 255, 0.05);
    background: repeating-radial-gradient(
      circle,
      transparent,
      transparent 4px,
      rgba(255, 255, 255, 0.02) 4px,
      rgba(255, 255, 255, 0.02) 6px
    );
  }

  .vinyl-center {
    width: 2.25rem;
    height: 2.25rem;
    background: linear-gradient(
      135deg,
      var(--m3c-primary) 0%,
      var(--m3c-tertiary) 100%
    );
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    box-shadow:
      inset 0 2px 4px rgba(0, 0, 0, 0.2),
      0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .vinyl-icon {
    font-size: 1.1rem;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }

  /* Floating Notes */
  .floating-note {
    position: absolute;
    font-size: 1.25rem;
    color: var(--m3c-primary);
    opacity: 0;
    pointer-events: none;
  }

  .note-1 {
    top: 10%;
    left: -10%;
    animation: floatNote 3s ease-in-out infinite;
  }
  .note-2 {
    top: 40%;
    right: -15%;
    animation: floatNote 3.5s ease-in-out infinite 1.2s;
    color: var(--m3c-tertiary);
  }
  .note-3 {
    top: -15%;
    right: 25%;
    animation: floatNote 4s ease-in-out infinite 0.6s;
    color: var(--m3c-secondary);
  }

  .wait-title {
    @apply --m3-title-large;
    font-weight: 700;
    color: var(--m3c-on-surface);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .selector-badge {
    background-color: var(--m3c-primary-container);
    color: var(--m3c-on-primary-container);
    padding: 0.4rem 1rem;
    border-radius: var(--m3-shape-full);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    box-shadow: var(--m3-elevation-1);
    max-width: 100%;
  }

  .selector-name {
    @apply --m3-label-large;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .wait-description {
    @apply --m3-body-medium;
    color: var(--m3c-on-surface-variant);
    margin: 0;
  }

  .loading-wrapper {
    margin-top: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .footer-prompt {
    @apply --m3-label-large;
    color: var(--m3c-secondary);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 600;
    margin: 0;
    animation: pulse 2s infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes floatNote {
    0% {
      transform: translateY(10px) scale(0.6) rotate(0deg);
      opacity: 0;
    }
    30% {
      opacity: 0.8;
    }
    80% {
      opacity: 0.8;
    }
    100% {
      transform: translateY(-80px) scale(1.1) rotate(45deg);
      opacity: 0;
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }
</style>
