<script lang="ts">
  import { goto } from "$app/navigation";
  import { apiClient } from "$lib/backend/axios";
  import { onMount } from "svelte";
  import ShopItemCard from "$lib/components/ShopItemCard.svelte";
  import Spinner from "$lib/components/spinner.svelte";
  import Icon from "@iconify/svelte";
  import { Button, TextFieldOutlined } from "m3-svelte";

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

<div class="shop-container">
  <!-- Header -->
  <header class="shop-header">
    <div class="header-top">
      <Button variant="filled" onclick={() => goto("/")}>
        <Icon icon="lets-icons:back" style="font-size: 1.5rem;" />
      </Button>

      <h1 class="header-title">Shop</h1>

      <div class="spacer"></div>
    </div>

    <!-- Search Bar -->
    <div class="search-bar">
      <TextFieldOutlined
        label="Search items..."
        bind:value={searchQuery}
      />
    </div>
  </header>

  <main class="shop-main">
    {#if isLoading}
      <div class="loading-wrapper">
        <Spinner />
      </div>
    {:else}
      <!-- Featured Deals Section -->
      {#if deals.length > 0 && !searchQuery}
        <section class="shop-section">
          <h2 class="section-title">
            <Icon icon="mdi:fire" class="title-icon" style="color: #ef5350;" />
            Featured Deals
          </h2>
          <div class="item-grid">
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
        <section class="shop-section">
          <h2 class="section-title">
            <Icon icon="mdi:magnify" class="title-icon" style="color: var(--m3c-primary);" />
            Search Results
            <span class="results-count"
              >({allItems.filter(
                (item) =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  categories[item.type]
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
              ).length} items)</span
            >
          </h2>

          <div class="item-grid">
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
            <section class="shop-section">
              <h2 class="section-title">
                <Icon icon="mdi:tag-outline" class="title-icon" style="color: var(--m3c-primary);" />
                {categories[category]}
              </h2>

              <div class="item-grid">
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
        <div class="no-results">
          <Icon icon="mdi:search-off" class="no-results-icon" />
          <h3>No items found</h3>
          <p>Try adjusting your search terms</p>
        </div>
      {/if}
    {/if}
  </main>
</div>

<style>
  .shop-container {
    height: 100vh;
    overflow-y: auto;
    background-color: var(--m3c-background);
    color: var(--m3c-on-background);
  }

  .shop-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background-color: var(--m3c-surface-container);
    border-bottom: 1px solid var(--m3c-outline-variant);
    padding: 1rem;
  }

  .header-top {
    max-width: 80rem;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .header-title {
    font-family: var(--m3-font); font-size: 1.75rem; line-height: 1.286; font-weight: 400;
    margin: 0;
    color: var(--m3c-on-surface);
  }

  .spacer {
    width: 3.5rem;
  }

  .search-bar {
    max-width: 80rem;
    margin: 0 auto;
  }

  .search-bar > :global(*) {
    width: 100%;
  }

  .shop-main {
    max-width: 80rem;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .loading-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3rem 0;
  }

  .shop-section {
    margin-bottom: 3rem;
  }

  .section-title {
    font-family: var(--m3-font); font-size: 1.375rem; line-height: 1.273; font-weight: 400;
    margin-top: 0;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--m3c-on-background);
  }

  .title-icon {
    font-size: 1.75rem;
  }

  .results-count {
    font-family: var(--m3-font); font-size: 0.875rem; line-height: 1.429; font-weight: 400;
    color: var(--m3c-on-surface-variant);
    margin-left: 0.5rem;
  }

  .item-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  @media (min-width: 640px) {
    .item-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (min-width: 1024px) {
    .item-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (min-width: 1280px) {
    .item-grid {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }

  .no-results {
    text-align: center;
    padding: 3rem 0;
    color: var(--m3c-on-surface-variant);
  }

  .no-results-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .no-results h3 {
    font-family: var(--m3-font); font-size: 1.375rem; line-height: 1.273; font-weight: 400;
    margin-bottom: 0.5rem;
  }

  .no-results p {
    font-family: var(--m3-font); font-size: 0.875rem; line-height: 1.429; font-weight: 400;
  }
</style>
