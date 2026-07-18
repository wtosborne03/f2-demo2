<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";

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
      videoId: "F57P9C4SAW4",
      title:
        "Katy Perry - California Gurls (Official Music Video) ft. Snoop Dogg ",
      channelTitle: "Katy Perry",
      thumbnail: "https://i.ytimg.com/vi/F57P9C4SAW4/mqdefault.jpg",
      duration: "3:53",
    },
    {
      videoId: "OPf0YbXqDm0",
      title: "Uptown Funk",
      channelTitle: "Mark Ronson ft. Bruno Mars",
      thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg",
      duration: "4:30",
    },
    {
      videoId: "H58vbez_m4E",
      title: "Kendrick Lamar - Not Like Us",
      channelTitle: "Kendrick Lamar",
      thumbnail: "https://i.ytimg.com/vi/H58vbez_m4E/mqdefault.jpg",
      duration: "5:54",
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
  class="flex flex-col justify-start items-center h-full w-full max-w-md mx-auto px-6 py-6 space-y-6"
>
  <header class="text-center w-full">
    <h1 class="text-2xl font-black">Select a Music Video</h1>
  </header>

  <!-- Input Area -->
  <div class="join w-full shadow-md">
    <input
      type="text"
      class="input input-bordered input-lg join-item flex-grow font-semibold min-w-0"
      placeholder="Search YouTube..."
      bind:value={searchQuery}
      onkeydown={handleKeyPress}
    />
    <button
      type="button"
      class="btn btn-primary btn-lg join-item px-5 font-bold"
      onclick={handleSearch}
      disabled={isSearching}
    >
      {#if isSearching}
        <span class="loading loading-spinner"></span>
      {:else}
        Search
      {/if}
    </button>
  </div>

  <!-- Dynamic Content Area -->
  {#if isSearching}
    <div class="flex flex-col items-center justify-center py-12 gap-4 w-full">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="text-sm font-semibold opacity-70">Searching YouTube...</p>
    </div>
  {:else if $gameState.page_data?.results && $gameState.page_data.results.length > 0}
    <!-- Results list -->
    <section class="w-full flex flex-col gap-4">
      <div class="flex justify-between items-center px-1">
        <h2
          class="text-xs font-bold uppercase tracking-wider text-base-content/65"
        >
          Search Results
        </h2>
        <button
          class="text-xs font-bold text-primary hover:underline"
          onclick={() => {
            $gameState.page_data.results = [];
            searchQuery = "";
          }}
        >
          Clear
        </button>
      </div>

      <div class="flex flex-col gap-3 w-full">
        {#each $gameState.page_data.results as item}
          <button
            class="flex items-center gap-3 p-2 bg-base-200 border border-base-300 rounded-xl hover:bg-base-200/80 active:scale-[0.98] transition-all text-left w-full overflow-hidden"
            onclick={() => selectSong(item.videoId, item.title)}
          >
            <img
              src={item.thumbnail}
              alt=""
              class="w-24 h-14 object-cover rounded-lg bg-base-300 flex-shrink-0"
            />
            <div class="flex-grow min-w-0">
              <div class="font-bold text-sm truncate text-base-content">
                {item.title}
              </div>
              <div class="text-xs text-base-content/70 truncate mt-0.5">
                {item.channelTitle}
              </div>
              <div class="badge badge-sm badge-neutral mt-1">
                {Math.floor(item.durationSeconds / 60)}:{(
                  item.durationSeconds % 60
                )
                  .toString()
                  .padStart(2, "0")}
              </div>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {:else}
    <!-- Suggested Tracks list -->
    <section class="w-full flex flex-col gap-4">
      <h2
        class="text-xs font-bold uppercase tracking-wider text-base-content/65 px-1"
      >
        Suggested Tracks
      </h2>

      <div class="flex flex-col gap-3 w-full">
        {#each defaults as item}
          <button
            class="flex items-center gap-3 p-2 bg-base-200 border border-base-300 rounded-xl hover:bg-base-200/80 active:scale-[0.98] transition-all text-left w-full overflow-hidden"
            onclick={() => selectSong(item.videoId, item.title)}
          >
            <img
              src={item.thumbnail}
              alt=""
              class="w-24 h-14 object-cover rounded-lg bg-base-300 flex-shrink-0"
            />
            <div class="flex-grow min-w-0">
              <div class="font-bold text-sm truncate text-base-content">
                {item.title}
              </div>
              <div class="text-xs text-base-content/70 truncate mt-0.5">
                {item.channelTitle}
              </div>
              <div class="badge badge-sm badge-neutral mt-1">
                {item.duration}
              </div>
            </div>
          </button>
        {/each}
      </div>
    </section>
  {/if}
</div>
