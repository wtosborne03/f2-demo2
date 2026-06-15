<script lang="ts">
  import { goto } from "$app/navigation";
  import Spinner from "$lib/components/spinner.svelte";
  import { onMount } from "svelte";
  import { authClient } from "../../stores/authStore";
  import { apiClient } from "$lib/backend/axios";
  import type { Paths } from "$lib/backend/api";
  import Icon from "@iconify/svelte";
  import { Button, Card, ListItem } from "m3-svelte";

  const session = authClient.useSession();

  let stats: Paths.GetUsersStats.Responses.$200 | null = null;
  let loadingStats = false;

  const loadStats = async () => {
    if (loadingStats || stats) return;
    const client = await apiClient;
    if (!$session.data?.user) {
      return;
    }
    loadingStats = true;
    try {
      const { data } = await client!.getUsersStats();
      stats = data;
    } catch (e) {
      console.error("Failed to load stats:", e);
    } finally {
      loadingStats = false;
    }
  };

  $: if ($session.data?.user) {
    loadStats();
  }
</script>

<div class="stats-container">
  <div class="back-btn-wrapper">
    <Button variant="filled" onclick={() => goto("/")}>
      <Icon icon="lets-icons:back" style="font-size: 1.5rem;" />
    </Button>
  </div>

  <h1 class="stats-title">Stats</h1>

  {#if !stats}
    <div class="spinner-wrapper">
      <Spinner />
    </div>
  {:else}
    <div class="card-wrapper">
      <Card variant="outlined">
        <div class="card-items">
          <ListItem headline="Player Since" supporting={new Date(stats.playerSince).toDateString()}>
            {#snippet leading()}
              <Icon icon="mdi:calendar-range" class="stat-icon" />
            {/snippet}
          </ListItem>
          
          <ListItem headline="Prompts Answered" supporting={String(stats.totalPromptsAnswered)}>
            {#snippet leading()}
              <Icon icon="mdi:message-text-outline" class="stat-icon" />
            {/snippet}
          </ListItem>
          
          <ListItem headline="Games Played" supporting={String(stats.totalGamesPlayed)}>
            {#snippet leading()}
              <Icon icon="mdi:controller-classic-outline" class="stat-icon" />
            {/snippet}
          </ListItem>
          
          <ListItem headline="Doubloons Won" supporting={stats.totalDoubloonsWon.toLocaleString()}>
            {#snippet leading()}
              <Icon icon="mdi:coins" class="stat-icon" style="color: #ffb300;" />
            {/snippet}
          </ListItem>
          
          <ListItem headline="Drinks Taken" supporting={String(stats.totalDrinksTaken)}>
            {#snippet leading()}
              <Icon icon="mdi:glass-mug-variant" class="stat-icon" style="color: #ffb74d;" />
            {/snippet}
          </ListItem>
          
          <ListItem headline="Wins" supporting={String(stats.totalWins)}>
            {#snippet leading()}
              <Icon icon="mdi:trophy-outline" class="stat-icon" style="color: #ffd54f;" />
            {/snippet}
          </ListItem>
        </div>
      </Card>
    </div>
  {/if}
</div>

<style>
  .stats-container {
    padding: 2rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 32rem;
    margin: 0 auto;
    width: 100%;
  }

  .back-btn-wrapper {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    margin-bottom: 1.5rem;
  }

  .stats-title {
    font-family: var(--m3-font); font-size: 1.75rem; line-height: 1.286; font-weight: 400;
    color: var(--m3c-on-background);
    margin-top: 0;
    margin-bottom: 2rem;
  }

  .spinner-wrapper {
    display: flex;
    justify-content: center;
    padding: 3rem 0;
  }

  .card-wrapper {
    width: 100%;
  }

  .card-items {
    padding: 0.5rem 0;
  }

  .stat-icon {
    font-size: 1.5rem;
    color: var(--m3c-primary);
  }
</style>
