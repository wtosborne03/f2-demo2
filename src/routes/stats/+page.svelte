<script lang="ts">
  import { goto } from "$app/navigation";
  import Spinner from "$lib/components/spinner.svelte";
  import { onMount } from "svelte";
  import { authClient } from "../../stores/authStore";
  import { apiClient } from "$lib/backend/axios";
  import type { Paths } from "$lib/backend/api";
  import Icon from "@iconify/svelte";
  const session = authClient.useSession();

  let stats: Paths.GetUsersStats.Responses.$200 | null = null;

  // Load and Aggregate User Stats
  const loadStats = async () => {
    const client = await apiClient;
    if (!$session.data?.user) {
      return;
    }
    const { data } = await client!.getUsersStats();
    stats = data;
  };

  onMount(() => {
    loadStats();
  });
</script>

<div class="px-16 flex h-full flex-col justify-start items-center">
  <button
    class="btn preset-filled mb-6 mt-4 w-full sm:w-auto"
    on:click={() => goto("/")}
  >
    <Icon icon="lets-icons:back" font-size="2rem" />
  </button>
  <div class="text-2xl mb-3">Stats</div>
  {#if !stats}
    <Spinner />
  {:else}
    <table class="table w-full">
      <tbody>
        <tr>
          <th>Player Since</th>
          <td>{new Date(stats.playerSince).toDateString()}</td>
        </tr>
        <tr>
          <th>Prompts Answered</th>
          <td>{stats.totalPromptsAnswered}</td>
        </tr>
        <tr>
          <th>Games Played</th>
          <td>{stats.totalGamesPlayed}</td>
        </tr>
        <tr>
          <th
            >Doubloons <i class="fa-solid text-yellow-500 fa-coins ml-2"
            ></i></th
          >
          <td>{stats.totalDoubloonsWon.toLocaleString()}</td>
        </tr>
        <tr>
          <th>Drinks 🍺</th>
          <td>{stats.totalDrinksTaken}</td>
        </tr>
        <tr>
          <th>Wins</th>
          <td>{stats.totalWins}</td>
        </tr>
      </tbody>
    </table>
  {/if}
</div>
