<script lang="ts">
  import "$lib/index";
  import { onMount } from "svelte";
  import { get } from "svelte/store";

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
  import ShakeConfirm from "../pages/shake_confirm.svelte";
  import ShakeGame from "../pages/shake_game.svelte";
  import SketchMatch from "../pages/sketch_match.svelte";
  import Match from "../pages/match.svelte";
  import PhotoVote from "../pages/photo_vote.svelte";
  import Continue from "../pages/continue.svelte";
  import Brainstorm from "../pages/brainstorm.svelte";
  import Done from "../pages/done.svelte";
  import DrinkGame from "../pages/drink_game.svelte";
  import Drink from "../pages/drink.svelte";
  import Roulette from "../pages/roulette.svelte";
  import SpyPrompt from "../pages/spy_prompt.svelte";
  import RegularPrompt from "../pages/regular_prompt.svelte";
  import SpyVote from "../pages/spy_vote.svelte";
  import Spy from "../pages/spy.svelte";
  import Personal from "../pages/personal.svelte";
  import Bomb from "../pages/bomb.svelte";
  import { app_init } from "$lib/index";
  import ErrorBoundary from "$lib/components/error_boundary.svelte";
  import CharadesConfirm from "../pages/charades_confirm.svelte";
  import CharadesGuess from "../pages/charades_guess.svelte";
  import CharadesAct from "../pages/charades_act.svelte";
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
    shake_confirm: ShakeConfirm,
    shake_game: ShakeGame,
    sketch_match: SketchMatch,
    match: Match,
    photo_vote: PhotoVote,
    continue: Continue,
    brainstorm: Brainstorm,
    done: Done,
    drink_game: DrinkGame,
    drink: Drink,
    roulette: Roulette,
    spy_prompt: SpyPrompt,
    regular_prompt: RegularPrompt,
    spy_vote: SpyVote,
    spy: Spy,
    personal: Personal,
    bomb: Bomb,
    charades_confirm: CharadesConfirm,
    charades_guess: CharadesGuess,
    charades_act: CharadesAct,
  };
  app_init();
  /** Plays a background animation/emote */
</script>

{#key $player_state.screen}
  <div
    id="main-background"
    class="w-full h-full p-3"
    out:blur={{ duration: 200 }}
    in:blur={{ delay: 200, duration: 200 }}
  >
    <svelte:component this={screens[$player_state.screen]} />
  </div>
{/key}
