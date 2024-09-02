<script lang="ts">
  import "$lib/index";
  import { setup_script, app_init, sendMessage } from "$lib/index";
  import { onMount } from "svelte";

  import Start from "../pages/start.svelte";
  import Game from "../pages/game.svelte";
  import Blank from "../pages/blank.svelte";
  import GameAdmin from "../pages/game_admin.svelte";
  import MultipleChoice from "../pages/multiple_choice.svelte";
  import RoomEnded from "../pages/room_ended.svelte";
  import Vote from "../pages/vote.svelte";
  import Prompt from "../pages/prompt.svelte";
  import PromptPhoto from "../pages/prompt_photo.svelte";
  import Confirm from "../pages/confirm.svelte";

  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import { blur } from "svelte/transition";
  import { slide } from "svelte/transition";
  import gsap from "gsap";
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
    vote: Vote,
    prompt: Prompt,
    prompt_photo: PromptPhoto,
    confirm: Confirm,
  };

  player_state.subscribe((value: PlayerState) => {
    page_value = value.screen;
  });

  /** Plays a background animation/emote */
</script>

{#key page_value}
  <div
    id="main-background"
    class="w-full h-full"
    out:blur={{ duration: 200 }}
    in:blur={{ delay: 200, duration: 200 }}
  >
    <svelte:component this={screens[page_value]} />
  </div>
{/key}
