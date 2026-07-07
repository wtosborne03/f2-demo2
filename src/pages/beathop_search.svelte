<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button, TextFieldOutlined } from "m3-svelte";

  let searchQuery = "";
  let isSearching = false;

  // React to page data changes to reset loading state
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
      videoId: "dQw4w9WgXcQ",
      title: "Never Gonna Give You Up",
      channelTitle: "Rick Astley",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
      duration: "3:32",
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
      videoId: "TUVcVfQe-qI",
      title: "Levitating",
      channelTitle: "Dua Lipa",
      thumbnail: "https://i.ytimg.com/vi/TUVcVfQe-qI/mqdefault.jpg",
      duration: "3:23",
    },
    {
      videoId: "4NRXx6U8ABQ",
      title: "Blinding Lights",
      channelTitle: "The Weeknd",
      thumbnail: "https://i.ytimg.com/vi/4NRXx6U8ABQ/mqdefault.jpg",
      duration: "3:20",
    },
    {
      videoId: "djV11Xbc914",
      title: "Take On Me",
      channelTitle: "a-ha",
      thumbnail: "https://i.ytimg.com/vi/djV11Xbc914/mqdefault.jpg",
      duration: "3:40",
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

<div
  class="search-container flex flex-col w-full h-full px-4 py-6 overflow-y-auto"
>
  <header class="text-center mb-6">
    <h1 class="text-2xl font-black text-white tracking-wide uppercase">
      Pick a Music Video
    </h1>
    <p class="text-zinc-400 text-sm mt-1">
      Select a popular track or search for any video (1–7 minutes)
    </p>
  </header>

  <!-- Search Bar -->
  <div class="flex flex-row gap-2 items-center mb-6">
    <div class="grow">
      <TextFieldOutlined
        label="Search YouTube"
        placeholder="Enter artist or song name"
        bind:value={searchQuery}
        onkeydown={handleKeyPress}
      />
    </div>
    <button
      class="search-btn bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 h-12 font-bold transition-all flex items-center justify-center shrink-0 active:scale-95"
      onclick={handleSearch}
      disabled={isSearching}
    >
      {#if isSearching}
        <span class="spinner"></span>
      {:else}
        Search
      {/if}
    </button>
  </div>

  <!-- Search Results vs Suggestions -->
  {#if isSearching}
    <div class="flex flex-col items-center justify-center py-10 gap-2">
      <span class="spinner-large"></span>
      <p class="text-zinc-400 text-sm animate-pulse">Querying YouTube...</p>
    </div>
  {:else if $gameState.page_data?.results && $gameState.page_data.results.length > 0}
    <section class="results-section flex flex-col gap-4">
      <div class="flex flex-row justify-between items-center px-1">
        <h2 class="text-sm font-bold text-purple-400 uppercase tracking-widest">
          Search Results
        </h2>
        <button
          class="text-xs text-zinc-500 hover:text-zinc-400 underline font-semibold"
          onclick={() => {
            $gameState.page_data.results = [];
            searchQuery = "";
          }}
        >
          Clear
        </button>
      </div>
      <div class="flex flex-col gap-3">
        {#each $gameState.page_data.results as item}
          <button
            class="result-card flex flex-row items-center gap-3 p-3 bg-zinc-900/60 rounded-xl hover:bg-zinc-800/60 text-left transition-all active:scale-[0.98] {item.hasCloneHeroChart ? 'border-2 border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.08)] bg-emerald-950/5' : 'border border-zinc-800/80'}"
            onclick={() => selectSong(item.videoId, item.title)}
          >
            <img
              src={item.thumbnail}
              alt={item.title}
              class="w-20 h-14 object-cover rounded-md bg-zinc-950"
            />
            <div class="flex-1 min-w-0 flex flex-col">
              <span class="text-white text-sm font-bold truncate line-clamp-1"
                >{item.title}</span
              >
              <span class="text-zinc-400 text-xs truncate mt-0.5"
                >{item.channelTitle}</span
              >
              <div class="flex flex-row gap-1.5 mt-1.5 items-center">
                <span
                  class="duration-badge text-[10px] bg-purple-950 text-purple-300 font-bold px-1.5 py-0.5 rounded-full"
                >
                  {Math.floor(item.durationSeconds / 60)}:{(
                    item.durationSeconds % 60
                  )
                    .toString()
                    .padStart(2, "0")}
                </span>
                {#if item.hasCloneHeroChart}
                  <span
                    class="ch-badge text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="text-emerald-400"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    CH Chart
                  </span>
                {/if}
              </div>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {:else}
    <!-- Default suggestion songs -->
    <section class="suggestions-section flex flex-col gap-4">
      <h2
        class="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1"
      >
        Suggested Tracks
      </h2>
      <div class="grid grid-cols-1 gap-3">
        {#each defaults as item}
          <button
            class="result-card flex flex-row items-center gap-3 p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/40 text-left transition-all active:scale-[0.98]"
            onclick={() => selectSong(item.videoId, item.title)}
          >
            <img
              src={item.thumbnail}
              alt={item.title}
              class="w-20 h-14 object-cover rounded-md bg-zinc-950"
            />
            <div class="flex-1 min-w-0 flex flex-col">
              <span class="text-white text-sm font-bold truncate line-clamp-1"
                >{item.title}</span
              >
              <span class="text-zinc-400 text-xs truncate mt-0.5"
                >{item.channelTitle}</span
              >
              <span
                class="duration-badge self-start text-[10px] bg-zinc-800 text-zinc-300 font-bold px-1.5 py-0.5 rounded-full mt-1.5"
              >
                {item.duration}
              </span>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .search-container {
    height: 100%;
    box-sizing: border-box;
  }

  /* Custom Loading Spinner */
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
  }

  .spinner-large {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(147, 51, 234, 0.2);
    border-radius: 50%;
    border-top-color: rgb(147, 51, 234);
    animation: spin 0.8s linear infinite;
    margin-bottom: 0.5rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Force responsive fields in Svelte */
  :global(.search-container .m3-container) {
    width: 100% !important;
    height: 3rem !important;
  }
  :global(.search-container input) {
    font-size: 1rem !important;
    padding-inline-start: 1rem !important;
    border-radius: 8px !important;
    background: rgba(255, 255, 255, 0.03) !important;
  }
  :global(.search-container label) {
    font-size: 0.85rem !important;
    inset-inline-start: 0.75rem !important;
  }
</style>
