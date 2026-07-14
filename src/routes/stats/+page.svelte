<script lang="ts">
  import { goto } from "$app/navigation";
  import Spinner from "$lib/components/spinner.svelte";
  import { onMount } from "svelte";
  import { authClient } from "../../stores/authStore";
  import { apiClient } from "$lib/backend/axios";
  import type { Paths } from "$lib/backend/api";
  import Icon from "@iconify/svelte";
  import Button from "m3-svelte/Button.svelte";

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

<div class="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-8">
  <!-- Back Button -->
  <div class="mb-6 flex w-full justify-start">
    <Button
      variant="filled"
      size="l"
      onclick={() => goto("/")}
      id="back-to-home-btn"
    >
      <Icon icon="lets-icons:back" style="font-size: 1.5rem;" />
    </Button>
  </div>

  <h1 class="mb-8 text-3xl font-bold tracking-tight text-base-content">
    Stats
  </h1>

  {#if !stats}
    <div class="flex justify-center py-12">
      <Spinner />
    </div>
  {:else}
    <!-- daisyUI Card -->
    <div class="card w-full border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body p-4 sm:p-6 divide-y divide-base-200">
        <!-- Player Since -->
        <div class="flex items-center justify-between py-3.5">
          <div class="flex items-center gap-3">
            <Icon icon="mdi:calendar-range" class="text-2xl text-primary" />
            <span class="font-medium text-base-content/80">Player Since</span>
          </div>
          <span class="font-semibold text-base-content"
            >{new Date(stats.playerSince).toDateString()}</span
          >
        </div>

        <!-- Prompts Answered -->
        <div class="flex items-center justify-between py-3.5">
          <div class="flex items-center gap-3">
            <Icon
              icon="mdi:message-text-outline"
              class="text-2xl text-primary"
            />
            <span class="font-medium text-base-content/80"
              >Prompts Answered</span
            >
          </div>
          <span class="font-semibold text-base-content"
            >{stats.totalPromptsAnswered}</span
          >
        </div>

        <!-- Games Played -->
        <div class="flex items-center justify-between py-3.5">
          <div class="flex items-center gap-3">
            <Icon
              icon="mdi:controller-classic-outline"
              class="text-2xl text-primary"
            />
            <span class="font-medium text-base-content/80">Games Played</span>
          </div>
          <span class="font-semibold text-base-content"
            >{stats.totalGamesPlayed}</span
          >
        </div>

        <!-- Doubloons Won -->
        <div class="flex items-center justify-between py-3.5">
          <div class="flex items-center gap-3">
            <Icon icon="mdi:coins" class="text-2xl text-amber-500" />
            <span class="font-medium text-base-content/80">Doubloons Won</span>
          </div>
          <span class="font-semibold text-base-content"
            >{stats.totalDoubloonsWon.toLocaleString()}</span
          >
        </div>

        <!-- Drinks Taken -->
        <div class="flex items-center justify-between py-3.5">
          <div class="flex items-center gap-3">
            <Icon
              icon="mdi:glass-mug-variant"
              class="text-2xl text-orange-400"
            />
            <span class="font-medium text-base-content/80">Drinks Taken</span>
          </div>
          <span class="font-semibold text-base-content"
            >{stats.totalDrinksTaken}</span
          >
        </div>

        <!-- Wins -->
        <div class="flex items-center justify-between py-3.5">
          <div class="flex items-center gap-3">
            <Icon icon="mdi:trophy-outline" class="text-2xl text-yellow-400" />
            <span class="font-medium text-base-content/80">Wins</span>
          </div>
          <span class="font-semibold text-base-content">{stats.totalWins}</span>
        </div>
      </div>
    </div>
  {/if}
</div>
