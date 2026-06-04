<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import { dbClient } from "../../stores/apiClient";
  import Spinner from "./spinner.svelte";

  // Component Props
  export let userId: string;
  export let gameId: number | undefined = undefined;

  interface GameImage {
    id: number;
    content: string;
    createdAt: number;
    game: number;
    minigame: number;
    minigameName?: string;
    prompt?: string;
    votes?: number;
  }

  let images: GameImage[] = [];
  let loading = true;
  let error: string | null = null;

  // Lightbox State
  let activeIndex: number | null = null;

  async function fetchImages() {
    try {
      loading = true;
      const client = get(dbClient);
      if (!client) {
        throw new Error("API Client not loaded");
      }

      // Call the endpoint using axios wrapper to bypass strict TypeScript typings in api.d.ts
      const response = await (client as any).get(`/users/${userId}/images`, {
        params: gameId !== undefined ? { gameId: String(gameId) } : {},
      });

      images = response.data || [];
    } catch (e: any) {
      console.error("Failed to load user images:", e);
      error = e.message || "Failed to load images";
    } finally {
      loading = false;
    }
  }

  function openLightbox(index: number) {
    activeIndex = index;
    if (typeof document !== "undefined") {
      document.body.style.overflow = "hidden";
    }
  }

  function closeLightbox() {
    activeIndex = null;
    if (typeof document !== "undefined") {
      document.body.style.overflow = "";
    }
  }

  function prevImage(e: Event) {
    e.stopPropagation();
    if (activeIndex !== null && images.length > 0) {
      activeIndex = (activeIndex - 1 + images.length) % images.length;
    }
  }

  function nextImage(e: Event) {
    e.stopPropagation();
    if (activeIndex !== null && images.length > 0) {
      activeIndex = (activeIndex + 1) % images.length;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (activeIndex === null) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") prevImage(e);
    if (e.key === "ArrowRight") nextImage(e);
  }

  onMount(() => {
    fetchImages();
    return () => {
      // Clean up body scroll lock if unmounted while open
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  });
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="grid-wrapper">
  {#if loading}
    <div class="spinner-container">
      <Spinner />
      <span class="loading-text">Fetching your creations...</span>
    </div>
  {:else if error}
    <div class="error-container">
      <p class="error-text">⚠️ {error}</p>
      <button class="retry-btn" onclick={fetchImages}>Retry</button>
    </div>
  {:else if images.length === 0}
    <div class="empty-container">
      <div class="empty-icon">🎨</div>
      <p class="empty-text">No images generated in this session yet.</p>
    </div>
  {:else}
    <div class="grid">
      {#each images as img, i}
        <button class="grid-card" onclick={() => openLightbox(i)}>
          <div class="img-container">
            <img src={img.content} alt={img.prompt || "Generated creation"} loading="lazy" />
          </div>
          <div class="card-overlay">
            <span class="minigame-tag">{img.minigameName || "Minigame"}</span>
            {#if img.prompt}
              <p class="prompt-preview">{img.prompt}</p>
            {/if}
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<!-- Lightbox Modal -->
{#if activeIndex !== null && images[activeIndex]}
  {@const current = images[activeIndex]}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="lightbox" onclick={closeLightbox} role="dialog" aria-modal="true" tabindex="-1">
    <button class="close-btn" onclick={closeLightbox} aria-label="Close lightbox">
      <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </button>

    <button class="nav-btn prev-btn" onclick={prevImage} aria-label="Previous image">
      <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
    </button>

    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="lightbox-content" onclick={(e) => e.stopPropagation()} role="document">
      <div class="lightbox-img-wrapper">
        <img src={current.content} alt={current.prompt || "Creation details"} />
      </div>
      <div class="lightbox-details">
        <div class="details-header">
          <span class="game-tag">Game #{current.game}</span>
          <span class="minigame-tag-large">{current.minigameName || "Minigame"}</span>
        </div>
        {#if current.prompt}
          <p class="lightbox-prompt">"{current.prompt}"</p>
        {/if}
        <div class="details-footer">
          <span class="date-text">{new Date(current.createdAt).toLocaleDateString()}</span>
          {#if current.votes !== undefined && current.votes !== null}
            <span class="votes-badge">⭐ {current.votes} {current.votes === 1 ? 'vote' : 'votes'}</span>
          {/if}
        </div>
      </div>
    </div>

    <button class="nav-btn next-btn" onclick={nextImage} aria-label="Next image">
      <svg viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
    </button>
  </div>
{/if}

<style>
  .grid-wrapper {
    width: 100%;
    margin-top: 1rem;
  }

  .spinner-container, .error-container, .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 1.5rem;
    text-align: center;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
  }

  .loading-text {
    margin-top: 1rem;
    color: var(--m3c-on-surface-variant);
    font-size: 0.95rem;
    font-weight: 500;
  }

  .error-text {
    color: var(--m3c-error);
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .retry-btn {
    background: var(--m3c-primary);
    color: var(--m3c-on-primary);
    border: none;
    padding: 0.6rem 1.5rem;
    border-radius: 2rem;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .retry-btn:hover {
    transform: scale(1.05);
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 0.75rem;
  }

  .empty-text {
    color: var(--m3c-on-surface-variant);
    font-size: 1rem;
  }

  /* Responsive Grid styling */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
    width: 100%;
  }

  @media (min-width: 480px) {
    .grid {
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
  }

  .grid-card {
    position: relative;
    padding: 0;
    margin: 0;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 1.25rem;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), 
                box-shadow 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
                border-color 0.2s;
  }

  .grid-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .img-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background: #111;
  }

  .img-container img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  .grid-card:hover .img-container img {
    transform: scale(1.08);
  }

  .card-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 100%);
    padding: 1.5rem 0.75rem 0.75rem 0.75rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    opacity: 0.9;
    transition: opacity 0.2s;
  }

  .minigame-tag {
    font-size: 0.7rem;
    background: rgba(255, 255, 255, 0.15);
    color: #fff;
    padding: 0.15rem 0.5rem;
    border-radius: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    backdrop-filter: blur(5px);
  }

  .prompt-preview {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.9);
    margin: 0.25rem 0 0 0;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    font-weight: 500;
  }

  /* Full-Screen Lightbox Modal styling */
  .lightbox {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(10, 10, 10, 0.92);
    backdrop-filter: blur(25px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    box-sizing: border-box;
    animation: fadeIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .lightbox-content {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 2rem;
    overflow: hidden;
    max-width: 480px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes scaleUp {
    from { transform: scale(0.92); }
    to { transform: scale(1); }
  }

  .lightbox-img-wrapper {
    width: 100%;
    aspect-ratio: 1;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .lightbox-img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .lightbox-details {
    padding: 1.5rem;
    background: linear-gradient(to bottom, rgba(20, 20, 20, 0.4), rgba(10, 10, 10, 0.8));
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .details-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .game-tag {
    font-size: 0.75rem;
    font-weight: bold;
    color: var(--m3c-primary);
    background: rgba(255, 255, 255, 0.05);
    padding: 0.25rem 0.6rem;
    border-radius: 0.5rem;
    text-transform: uppercase;
  }

  .minigame-tag-large {
    font-size: 0.75rem;
    font-weight: 800;
    color: #fff;
    background: var(--m3c-secondary, rgba(255, 255, 255, 0.15));
    padding: 0.25rem 0.6rem;
    border-radius: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .lightbox-prompt {
    font-size: 1.05rem;
    color: #fff;
    margin: 0;
    font-style: italic;
    line-height: 1.4;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  .details-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 0.75rem;
  }

  .date-text {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
  }

  .votes-badge {
    font-size: 0.8rem;
    font-weight: bold;
    color: #ffd54f;
    background: rgba(255, 213, 79, 0.12);
    padding: 0.2rem 0.6rem;
    border-radius: 1rem;
  }

  /* Lightbox control buttons */
  .close-btn {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    transition: background 0.2s, transform 0.2s;
    z-index: 1010;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }

  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #fff;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    transition: background 0.2s, transform 0.2s;
    z-index: 1010;
  }

  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-50%) scale(1.05);
  }

  .prev-btn {
    left: 1.5rem;
  }

  .next-btn {
    right: 1.5rem;
  }

  .close-btn svg, .nav-btn svg {
    width: 1.5rem;
    height: 1.5rem;
    fill: currentColor;
  }

  /* Hide nav buttons on narrow screens and let user click backdrop/close */
  @media (max-width: 600px) {
    .nav-btn {
      display: none;
    }
  }
</style>
