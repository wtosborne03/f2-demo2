<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { Button, TextFieldOutlined } from "m3-svelte";

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

<div
  class="flex flex-col w-full h-full px-4 py-6 overflow-y-auto font-sans text-zinc-100"
>
  <header class="mb-6">
    <h1 class="text-lg font-semibold tracking-tight text-zinc-200">
      Pick a Music Video
    </h1>
    <p class="text-xs text-zinc-400 mt-1">
      Choose a track or search for any music video (1–7 minutes)
    </p>
  </header>

  <!-- Input Area -->
  <div class="flex items-center gap-2 mb-6 search-box-wrapper">
    <div class="grow">
      <TextFieldOutlined
        label="Search YouTube"
        placeholder="Artist or song name..."
        bind:value={searchQuery}
        onkeydown={handleKeyPress}
      />
    </div>
    <button
      class="border border-zinc-700 bg-zinc-800/40 hover:bg-zinc-800 text-zinc-200 rounded-xl px-4 h-12 text-sm font-medium transition-all flex items-center justify-center shrink-0 active:scale-[0.98] disabled:opacity-50"
      onclick={handleSearch}
      disabled={isSearching}
    >
      {#if isSearching}
        <div
          class="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"
        ></div>
      {:else}
        Search
      {/if}
    </button>
  </div>

  <!-- Dynamic Content Area -->
  {#if isSearching}
    <div class="flex-1 flex flex-col items-center justify-center py-12 gap-3">
      <div
        class="w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"
      ></div>
      <p class="text-xs text-zinc-500 font-mono animate-pulse">Searching...</p>
    </div>
  {:else if $gameState.page_data?.results && $gameState.page_data.results.length > 0}
    <!-- Results list -->
    <section class="flex flex-col gap-4">
      <div class="flex items-center justify-between px-1">
        <h2
          class="text-xs font-semibold uppercase tracking-wider text-zinc-400"
        >
          Search Results
        </h2>
        <button
          class="text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
          onclick={() => {
            $gameState.page_data.results = [];
            searchQuery = "";
          }}
        >
          Clear
        </button>
      </div>

      <div class="flex flex-col gap-2">
        {#each $gameState.page_data.results as item}
          <button
            class="flex items-center gap-4 p-3 border border-zinc-800/60 bg-zinc-900/10 rounded-xl hover:bg-zinc-800/30 text-left transition-all active:scale-[0.99]"
            onclick={() => selectSong(item.videoId, item.title)}
          >
            <img
              src={item.thumbnail}
              alt=""
              class="w-16 h-12 object-cover rounded bg-zinc-900 shrink-0"
            />
            <div class="min-w-0 flex-1 flex flex-col">
              <span class="text-sm font-medium text-zinc-200 truncate"
                >{item.title}</span
              >
              <span class="text-xs text-zinc-400 truncate mt-0.5"
                >{item.channelTitle}</span
              >
              <span
                class="self-start text-[10px] bg-zinc-800/60 text-zinc-400 font-mono px-1.5 py-0.5 rounded-md mt-1.5"
              >
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
    <section class="flex flex-col gap-4">
      <h2
        class="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-1"
      >
        Suggested Tracks
      </h2>

      <div class="flex flex-col gap-2">
        {#each defaults as item}
          <button
            class="flex items-center gap-4 p-3 border border-zinc-800/60 bg-zinc-900/10 rounded-xl hover:bg-zinc-800/30 text-left transition-all active:scale-[0.99]"
            onclick={() => selectSong(item.videoId, item.title)}
          >
            <img
              src={item.thumbnail}
              alt=""
              class="w-16 h-12 object-cover rounded bg-zinc-900 shrink-0"
            />
            <div class="min-w-0 flex-1 flex flex-col">
              <span class="text-sm font-medium text-zinc-200 truncate"
                >{item.title}</span
              >
              <span class="text-xs text-zinc-400 truncate mt-0.5"
                >{item.channelTitle}</span
              >
              <span
                class="self-start text-[10px] bg-zinc-800/60 text-zinc-400 font-mono px-1.5 py-0.5 rounded-md mt-1.5"
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
  /* Svelte-isolated input overwrites for cleaner layout matches */
  :global(.search-box-wrapper .m3-container) {
    width: 100% !important;
    height: 3rem !important;
  }
  :global(.search-box-wrapper input) {
    font-size: 0.875rem !important;
    padding-inline-start: 1rem !important;
    border-radius: 12px !important;
    background: rgba(255, 255, 255, 0.02) !important;
  }
  :global(.search-box-wrapper label) {
    font-size: 0.75rem !important;
    inset-inline-start: 0.75rem !important;
  }
</style>
