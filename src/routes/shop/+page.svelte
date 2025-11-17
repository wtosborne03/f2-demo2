<script lang="ts">
  import { goto } from "$app/navigation";
  import { apiClient } from "$lib/backend/axios";
  import { onMount } from "svelte";
  import ShopItemCard from "$lib/components/ShopItemCard.svelte";
  import Spinner from "$lib/components/spinner.svelte";
  import Icon from "@iconify/svelte";

  let shopItems: { [key: string]: any } = {};
  let allItems: any[] = [];
  let searchQuery = "";
  let deals: any[] = [];
  let isLoading = true;

  const thumnailPrefix =
    import.meta.env.VITE_PUBLIC_API_URL + "/static/thumbnails";

  const categories: { [key: string]: string } = {
    0: "Eyes",
    1: "Hair",
    2: "Mouth",
    3: "Emotes",
  };

  onMount(async () => {
    const client = await apiClient;
    const { data } = await client!.getShopItems();
    const items = data.filter((item) => !item.owned);
    allItems = items;
    shopItems = Object.groupBy(items, ({ type }) => type);
    deals = items.filter(
      (item) => item.salePrice !== undefined && item.salePrice < item.price,
    );
    isLoading = false;
  });
</script>

<div
  class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white"
>
  <!-- Header -->
  <header
    class="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/20"
  >
    <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <button class="btn preset-filled w-14" on:click={() => goto("/")}>
        <Icon icon="lets-icons:back" font-size="2rem" />
      </button>

      <h1 class="text-3xl font-bold text-white">Shop</h1>

      <div class="w-14"></div>
      <!-- Spacer for centering -->
    </div>

    <!-- Search Bar -->
    <div class="max-w-7xl mx-auto px-4 pb-4">
      <div class="relative">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search items..."
          class="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
        />
        <i
          class="fa-solid fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
        ></i>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-8">
    {#if isLoading}
      <div class="flex justify-center items-center py-12">
        <Spinner />
      </div>
    {:else}
      <!-- Featured Deals Section -->
      {#if deals.length > 0 && !searchQuery}
        <section class="mb-12">
          <h2 class="text-2xl font-bold mb-6 flex items-center">
            <i class="fa-solid fa-fire text-red-500 mr-3"></i>
            Featured Deals
          </h2>
          <div
            class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {#each deals.slice(0, 4) as item}
              <ShopItemCard
                {item}
                thumbnailPrefix={thumnailPrefix}
                {categories}
              />
            {/each}
          </div>
        </section>
      {/if}

      <!-- Search Results or Categories -->
      {#if searchQuery}
        <!-- Search Results in List View -->
        <section>
          <h2 class="text-2xl font-bold mb-6 flex items-center">
            <i class="fa-solid fa-search text-purple-400 mr-3"></i>
            Search Results
            <span class="ml-2 text-sm text-gray-400"
              >({allItems.filter(
                (item) =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  categories[item.type]
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
              ).length} items)</span
            >
          </h2>

          <div
            class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            {#each allItems.filter((item) => item.name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase()) || categories[item.type]
                  ?.toLowerCase()
                  .includes(searchQuery.toLowerCase())) as item}
              <ShopItemCard
                {item}
                thumbnailPrefix={thumnailPrefix}
                {categories}
                showCategory={true}
              />
            {/each}
          </div>
        </section>
      {:else}
        <!-- Categories -->
        {#each Object.keys(shopItems) as category}
          {@const items = shopItems[category]}
          {#if items && items.length > 0}
            <section class="mb-12">
              <h2 class="text-2xl font-bold mb-6 flex items-center">
                <i class="fa-solid fa-tag text-purple-400 mr-3"></i>
                {categories[category]}
              </h2>

              <div
                class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              >
                {#each items as item}
                  <ShopItemCard
                    {item}
                    thumbnailPrefix={thumnailPrefix}
                    {categories}
                  />
                {/each}
              </div>
            </section>
          {/if}
        {/each}
      {/if}

      <!-- No Results -->
      {#if searchQuery && allItems.filter((item) => item.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) || categories[item.type]
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase())).length === 0}
        <div class="text-center py-12">
          <i class="fa-solid fa-search text-6xl text-gray-600 mb-4"></i>
          <h3 class="text-2xl font-bold text-gray-400 mb-2">No items found</h3>
          <p class="text-gray-500">Try adjusting your search terms</p>
        </div>
      {/if}
    {/if}
  </main>
</div>
