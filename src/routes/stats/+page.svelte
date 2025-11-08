<script lang="ts">
  import { goto } from "$app/navigation";
  import { authStore } from "../../stores/authStore";
  import Spinner from "$lib/components/spinner.svelte";
  import { onMount } from "svelte";

  let age = "";
  let loading = true;
  let prompt_count = 0;
  let game_count = 0;
  let doubloons = 0;
  let drinks = 0;
  let wins = 0;

  // Load and Aggregate User Stats
  const loadStats = async () => {
    const userId = $authStore.user?.id;
    if (!userId) return;

    // age = $authStore.user!.created_at;

    // const { data: prompts } = await supabase
    //   .from("prompts")
    //   .select("*")
    //   .eq("user", userId);

    // const { data: games } = await supabase
    //   .from("games_played")
    //   .select("*")
    //   .eq("user", userId);

    // prompt_count = prompts?.length || 0;
    // game_count = games?.length || 0;

    // games?.forEach((game) => {
    //   doubloons += game.doubloons;
    //   drinks += game.drinks;
    //   if (game.won) wins++;
    // });

    loading = false;
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
    <i class="fa-solid fa-arrow-left mr-2"></i>Back
  </button>
  <div class="text-2xl mb-3">Stats</div>
  {#if loading || $authStore.session === null}
    <Spinner />
  {:else}
    <table class="table w-full">
      <tbody>
        <tr>
          <th>Player Since</th>
          <td>{new Date(age).toDateString()}</td>
        </tr>
        <tr>
          <th>Prompts Answered</th>
          <td>{prompt_count}</td>
        </tr>
        <tr>
          <th>Games Played</th>
          <td>{game_count}</td>
        </tr>
        <tr>
          <th
            >Doubloons <i class="fa-solid text-yellow-500 fa-coins ml-2"
            ></i></th
          >
          <td>{doubloons.toLocaleString()}</td>
        </tr>
        <tr>
          <th>Drinks 🍺</th>
          <td>{drinks}</td>
        </tr>
        <tr>
          <th>Wins</th>
          <td>{wins}</td>
        </tr>
      </tbody>
    </table>
  {/if}
</div>
