<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button, TextFieldOutlined } from "m3-svelte";
  import iconSearch from "@ktibow/iconset-material-symbols/search";

  let searchQuery = "";
  let isSearching = false;

  let lastPageData: any = null;
  $: {
    const currentData = $gameState.page_data;
    if (currentData !== lastPageData) {
      lastPageData = currentData;
      isSearching = false;
    }
  }

  // Pre-configured hit songs
  const defaults = [
    {
      videoId: "ila-hAUXR5U",
      title: "Kanye West - Flashing Lights ft. Dwele",
      channelTitle: "Kanye West",
      thumbnail: "https://i.ytimg.com/vi/ila-hAUXR5U/mqdefault.jpg",
      duration: "2:53",
    },
    {
      videoId: "OPf0YbXqDm0",
      title: "Uptown Funk",
      channelTitle: "Mark Ronson ft. Bruno Mars",
      thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg",
      duration: "4:30",
    },
    {
      videoId: "9bZkp7q19f0",
      title: "Gangnam Style",
      channelTitle: "PSY",
      thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg",
      duration: "4:12",
    },
    {
      videoId: "KWoTyfPsqbE",
      title: "Sabrina Carpenter - House Tour (Official Video)",
      channelTitle: "Sabrina Carpenter",
      thumbnail: "https://i.ytimg.com/vi/KWoTyfPsqbE/mqdefault.jpg",
      duration: "3:34",
    },
    {
      videoId: "4NRXx6U8ABQ",
      title: "Blinding Lights",
      channelTitle: "The Weeknd",
      thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg",
      duration: "3:20",
    },
    {
      videoId: "dI3xkL7qUAc",
      title: "Doja Cat - Need to Know (Official Video)",
      channelTitle: "Doja Cat",
      thumbnail: "https://i.ytimg.com/vi/dI3xkL7qUAc/mqdefault.jpg",
      duration: "3:39",
    },
  ];

  function handleSearch() {
    if (!searchQuery.trim()) return;
    isSearching = true;
    gameClient.sendInput({
      type: "search",
      query: searchQuery.trim(),
    });
  }

  function handleKeyPress(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  function selectSong(videoId: string, title: string) {
    gameClient.sendInput({
      type: "select_video",
      videoId,
      title,
    });
  }
</script>

<div class="search-container">
  <header class="search-header">
    <h1 class="title">Pick a Music Video</h1>
    <p class="subtitle">
      Choose a suggested track or search for any music video (1–7 minutes)
    </p>
  </header>

  <!-- Input Area -->
  <div class="search-box-wrapper">
    <div class="input-grow">
      <TextFieldOutlined
        label="Search YouTube"
        placeholder="Artist or song name..."
        leadingIcon={iconSearch}
        bind:value={searchQuery}
        onkeydown={handleKeyPress}
      />
    </div>
    <div class="search-button-wrapper">
      <Button
        variant="filled"
        onclick={handleSearch}
        disabled={isSearching}
        size="m"
      >
        {#if isSearching}
          <div class="spinner-small"></div>
        {:else}
          Search
        {/if}
      </Button>
    </div>
  </div>

  <!-- Dynamic Content Area -->
  {#if isSearching}
    <div class="loading-state">
      <div class="spinner-large"></div>
      <p class="loading-text">Searching YouTube...</p>
    </div>
  {:else if $gameState.page_data?.results && $gameState.page_data.results.length > 0}
    <!-- Results list -->
    <section class="section-container">
      <div class="section-header">
        <h2 class="section-title">Search Results</h2>
        <button
          class="clear-button"
          onclick={() => {
            $gameState.page_data.results = [];
            searchQuery = "";
          }}
        >
          Clear
        </button>
      </div>

      <div class="songs-grid">
        {#each $gameState.page_data.results as item}
          <button
            class="song-card"
            onclick={() => selectSong(item.videoId, item.title)}
          >
            <img src={item.thumbnail} alt="" class="song-thumbnail" />
            <div class="song-info">
              <span class="song-title">{item.title}</span>
              <span class="song-channel">{item.channelTitle}</span>
              <span class="song-duration">
                {Math.floor(item.durationSeconds / 60)}:{(
                  item.durationSeconds % 60
                )
                  .toString()
                  .padStart(2, "0")}
              </span>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {:else}
    <!-- Suggested Tracks list -->
    <section class="section-container">
      <h2 class="section-title">Suggested Tracks</h2>

      <div class="songs-grid">
        {#each defaults as item}
          <button
            class="song-card"
            onclick={() => selectSong(item.videoId, item.title)}
          >
            <img src={item.thumbnail} alt="" class="song-thumbnail" />
            <div class="song-info">
              <span class="song-title">{item.title}</span>
              <span class="song-channel">{item.channelTitle}</span>
              <span class="song-duration">{item.duration}</span>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .search-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: 1.5rem 1rem;
    overflow-y: auto;
    box-sizing: border-box;
    font-family: var(--m3-font, system-ui);
    background-color: var(--m3c-surface);
    color: var(--m3c-on-surface);
  }

  .search-header {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .search-header .title {
    @apply --m3-headline-medium;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.02em;
    color: var(--m3c-on-surface);
  }

  .search-header .subtitle {
    @apply --m3-body-medium;
    color: var(--m3c-on-surface-variant);
    margin-top: 0.5rem;
  }

  .search-box-wrapper {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    width: 100%;
  }

  .input-grow {
    flex-grow: 1;
    min-width: 0;
  }

  .search-button-wrapper {
    flex-shrink: 0;
  }

  /* Force m3-svelte TextField to take 100% width */
  :global(.input-grow .m3-container) {
    width: 100% !important;
  }

  .section-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-inline: 0.25rem;
  }

  .section-title {
    @apply --m3-title-medium;
    font-weight: 600;
    color: var(--m3c-secondary);
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .clear-button {
    @apply --m3-label-large;
    color: var(--m3c-primary);
    background: none;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .clear-button:hover {
    opacity: 0.8;
  }

  .songs-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }

  .song-card {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: var(--m3c-surface-container-low);
    border: 1px solid var(--m3c-outline-variant);
    border-radius: var(--m3-shape-large);
    text-align: left;
    transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
    cursor: pointer;
    width: 100%;
    outline: none;
  }

  .song-card:hover {
    background-color: var(--m3c-surface-container-high);
    border-color: var(--m3c-outline);
    box-shadow: var(--m3-elevation-1);
    transform: translateY(-1px);
  }

  .song-card:active {
    transform: scale(0.98);
  }

  .song-thumbnail {
    width: 9rem;
    height: 5.25rem;
    object-fit: cover;
    border-radius: var(--m3-shape-medium);
    background-color: var(--m3c-surface-container-highest);
    flex-shrink: 0;
  }

  .song-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex-grow: 1;
  }

  .song-title {
    @apply --m3-title-small;
    font-weight: 600;
    color: var(--m3c-on-surface);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .song-channel {
    @apply --m3-body-small;
    color: var(--m3c-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 0.15rem;
  }

  .song-duration {
    @apply --m3-label-small;
    background-color: var(--m3c-surface-container-highest);
    color: var(--m3c-on-surface-variant);
    align-self: start;
    padding: 0.15rem 0.4rem;
    border-radius: var(--m3-shape-small);
    font-family: monospace;
    margin-top: 0.4rem;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1rem;
    gap: 1rem;
  }

  .loading-text {
    @apply --m3-body-medium;
    color: var(--m3c-on-surface-variant);
    animation: pulse 1.5s infinite;
  }

  /* CSS Spinners matching M3 aesthetic */
  .spinner-small {
    width: 1.25rem;
    height: 1.25rem;
    border: 2px solid var(--m3c-on-primary);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .spinner-large {
    width: 2.5rem;
    height: 2.5rem;
    border: 3px solid var(--m3c-primary);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
</style>
