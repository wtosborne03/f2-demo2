<script lang="ts">
  import "$lib/index";
  import { setup_script, app_init } from "$lib/index";
  import { onMount } from "svelte";

  import Start from "../pages/start.svelte";
  import Game from "../pages/game.svelte";
  import Blank from "../pages/blank.svelte";
  import GameAdmin from "../pages/game_admin.svelte";
  import MultipleChoice from "../pages/multiple_choice.svelte";
  import RoomEnded from "../pages/room_ended.svelte";

  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  let page_value: string = "index";

  app_init();

  onMount(() => {
    setup_script();
  });

  const screens: { [key: string]: any } = {
    index: Start,
    blank: Blank,
    start: Game,
    can_start: GameAdmin,
    multiple_choice: MultipleChoice,
    room_ended: RoomEnded,
  };

  player_state.subscribe((value: PlayerState) => {
    page_value = value.screen;
  });
</script>

<svelte:component this={screens[page_value]} />
