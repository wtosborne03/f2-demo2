<script lang="ts">
  import { gameState } from "$lib/wsapi/gameClient";
</script>

<div class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 py-6 text-center">
  <div class="card bg-base-200 border border-base-300 shadow-xl p-8 w-full flex flex-col items-center gap-6">
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

    <h1 class="text-2xl font-black">Waiting for Song Selector</h1>

    {#if $gameState.page_data?.selectorName}
      <div class="badge badge-primary badge-lg py-4 px-6 text-base font-bold shadow-md">
        {$gameState.page_data.selectorName}
      </div>
    {/if}
  </div>
</div>

<style>
  @reference "../app.css";

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
      var(--color-primary) 0%,
      var(--color-secondary) 100%
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
    color: var(--color-primary);
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
    color: var(--color-secondary);
  }
  .note-3 {
    top: -15%;
    right: 25%;
    animation: floatNote 4s ease-in-out infinite 0.6s;
    color: var(--color-accent);
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
</style>
