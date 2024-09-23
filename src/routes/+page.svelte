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
  import Dilemma from "../pages/dilemma.svelte";
  import PhotoPicker from "../pages/photo_picker.svelte";

  import type { PlayerState } from "../types/player_state";
  import { player_state } from "../stores/player_state";
  import { blur } from "svelte/transition";
  import { slide } from "svelte/transition";
  import gsap from "gsap";
  import ListPrompt from "../pages/list_prompt.svelte";
  import ListGuess from "../pages/list_guess.svelte";
  import Ball from "../pages/ball.svelte";
  import BusCard from "../pages/bus_card.svelte";
  import ProductPrompt from "../pages/product_prompt.svelte";
  import ProductBlank from "../pages/product_blank.svelte";
  import ShakeConfirm from "../pages/shake_confirm.svelte";
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
    dilemma: Dilemma,
    photo_picker: PhotoPicker,
    list_prompt: ListPrompt,
    list_guess: ListGuess,
    ball: Ball,
    bus_card: BusCard,
    product_prompt: ProductPrompt,
    product_blank: ProductBlank,
    shake_confirm: ShakeConfirm,
  };

  player_state.subscribe((value: PlayerState) => {
    page_value = value.screen;
  });

  /** Plays a background animation/emote */
</script>

{#key page_value}
  <div
    id="main-background"
    class="w-full h-full p-4"
    out:blur={{ duration: 200 }}
    in:blur={{ delay: 200, duration: 200 }}
  >
    <svelte:component this={screens[page_value]} />
  </div>
{/key}
