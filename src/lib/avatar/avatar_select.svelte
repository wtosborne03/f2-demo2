<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    Rive,
    ViewModelInstanceColor,
    ViewModelInstanceNumber,
    ViewModelInstanceTrigger,
  } from "@rive-app/webgl2";
  import { get } from "svelte/store";
  import Spinner from "$lib/components/spinner.svelte";
  import Icon from "@iconify/svelte";
  import { Button, Card } from "m3-svelte";
  import { toaster } from "$lib/util/toaster";
  import { apiClient } from "$lib/backend/axios";
  import type { Avatar } from "$lib/wsapi/game";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { getHue, getSecondaryHue } from "$lib/util/color";
  import type { Paths } from "$lib/backend/api";

  let r: Rive;
  let color_input: ViewModelInstanceColor | undefined | null;
  let eyes_input: ViewModelInstanceNumber | undefined | null;
  let mouth_input: ViewModelInstanceNumber | undefined | null;
  let hair_input: ViewModelInstanceNumber | undefined | null;
  let emote_input: ViewModelInstanceNumber | undefined | null;
  let emote_fire_input: ViewModelInstanceTrigger | undefined | null;

  let canvasEl: HTMLCanvasElement;
  let owned_items: Paths.GetUsersOwned.Responses.$200 = {};
  let loadedin = false;

  const categories: { [key: string]: string } = {
    0: "Eyes",
    1: "Hair",
    2: "Mouth",
    3: "Emote",
  };

  onMount(() => {
    rCanvas();
    r = new Rive({
      src: import.meta.env.VITE_PUBLIC_API_URL + "/static/avatar/avatar.riv",
      canvas: canvasEl,
      autoplay: true,
      stateMachines: "AvatarState",
      onLoad: async () => {
        r.resizeDrawingSurfaceToCanvas();
        const avatarModel = r.viewModelByName("AvatarModel");
        const avatarState = avatarModel?.defaultInstance();
        r.bindViewModelInstance(avatarState!);
        eyes_input = avatarState?.number("eyes");
        mouth_input = avatarState?.number("mouth");
        hair_input = avatarState?.number("head");
        emote_input = avatarState?.number("playerEmote");
        avatarState!.enum("gameEmote")!.value = "None";
        color_input = avatarState?.color("color");
        color_input!.rgb(204, 0, 0);
        emote_fire_input = avatarState?.trigger("playPlayerEmote");
        const client = await apiClient;
        let data: any = {
          avatar_eyes: 0,
          avatar_hair: 0,
          avatar_mouth: 0,
          avatar_emote: 0,
        };
        try {
          data = (await client!.getUsersMe()).data;
        } catch (e) {
          console.log(e);
        }
        console.log(data);
        a_values["0"] = data.avatar_eyes || 0;
        a_values["2"] = data.avatar_mouth || 0;
        a_values["1"] = data.avatar_hair || 0;
        a_values["3"] = data.avatar_emote || 0;
        loadedin = true;

        update();

        const { data: ownedData } = await client!.getUsersOwned();
        owned_items = ownedData;
        console.log(ownedData);
      },
    });
  });

  let owned;
  let a_values: { [key: string]: number } = {
    "0": 3,
    "1": 0,
    "2": 0,
    "3": 0,
  };

  const update = async () => {
    if (eyes_input) eyes_input.value = a_values["0"];
    if (mouth_input) mouth_input.value = a_values["2"];
    if (hair_input) hair_input.value = a_values["1"];
    if (emote_input) emote_input.value = a_values["3"];
    if (loadedin) {
      saveAvatar();
    }
  };

  // Svelte action: add a quick pop animation on click
  const clickPop = (node: HTMLElement) => {
    const handler = () => {
      // add a class that triggers the keyframe, then remove it
      node.classList.add("pop-anim");
      window.setTimeout(() => node.classList.remove("pop-anim"), 260);
    };

    node.addEventListener("click", handler);
    return {
      destroy() {
        node.removeEventListener("click", handler);
      },
    };
  };

  const saveAvatar = async () => {
    const error = null;
    const client = await apiClient;
    try {
      await client!.putUsersAvatar(null, {
        avatar_eyes: a_values["0"],
        avatar_hair: a_values["1"],
        avatar_mouth: a_values["2"],
        avatar_emote: a_values["3"],
      });
      if (get(gameState).screen != "index") {
        const avatar: Avatar = {
          eyes: a_values["0"] || 0,
          hair: a_values["1"] || 0,
          mouth: a_values["2"] || 0,
          emote: a_values["3"] || 0,
        };
        gameClient.sendInput({
          type: "avatarUpdate",
          avatar: avatar,
        });
      }
    } catch (e) {}
  };

  $: a_values, update();

  onDestroy(() => {});

  const rCanvas = () => {
    if (!canvasEl) return;
    canvasEl.width = Math.max(window.innerWidth, window.innerHeight) / 5;
    canvasEl.height = canvasEl.width;
  };
</script>

<svelte:head>
  <title>Customize Avatar - Couch Cup</title>
  <meta
    name="description"
    content="Customize your Couch Cup avatar with owned items, emotes, eyes, mouth, and hair options."
  />
</svelte:head>

<div class="avatar-select-container">
  <header class="app-bar">
    <Button variant="filled" onclick={() => goto("/")} id="back-to-home-btn">
      <Icon icon="lets-icons:back" style="font-size: 1.5rem;" />
    </Button>
    <h1 class="app-bar-title" id="avatar-page-title">Customize Avatar</h1>
    <div class="app-bar-spacer"></div>
  </header>

  <main class="content-layout">
    <!-- Left Column: Avatar preview -->
    <div class="preview-column">
      <div class="preview-card-content">
        <div class="canvas-wrapper">
          <canvas
            bind:this={canvasEl}
            id="avatar-preview-canvas"
            class="avatar-canvas"
            onclick={() => emote_fire_input?.trigger()}
          ></canvas>
        </div>
        <div class="preview-status">
          <span class="status-badge" id="badge-tap-emote">
            <Icon
              icon="material-symbols:motion-photos-on-outline"
              class="badge-icon"
            />
            Tap to emote
          </span>
          <span class="status-badge save-status" id="badge-saved">
            <Icon
              icon="material-symbols:cloud-done-outline"
              class="badge-icon"
            />
            Changes Saved
          </span>
        </div>
      </div>
    </div>

    <!-- Right Column: Items / categories -->
    <div class="items-column">
      {#if loadedin}
        <div class="categories-list">
          {#each Object.keys(owned_items) as category}
            <section
              class="category-section"
              id={`category-section-${category}`}
            >
              <div class="category-header">
                <h2 class="category-title" id={`category-title-${category}`}>
                  {categories[category]}
                </h2>
                <span class="category-divider"></span>
              </div>

              <div class="items-grid">
                {#each owned_items[category] || [] as item}
                  <!-- item card -->
                  <button
                    use:clickPop
                    class="item-button"
                    class:selected={a_values[category] == item.shop.value}
                    style={`--item-bg: ${getHue(item.shop.id)}`}
                    onclick={() => (a_values[category] = item.shop.value)}
                    id={`item-btn-${item.shop.id}`}
                  >
                    <span class="item-name">{item.shop.name}</span>
                    <div class="checkbox-wrapper">
                      {#if a_values[category] == item.shop.value}
                        <Icon
                          icon="pixelarticons:checkbox"
                          class="checkbox-icon"
                        />
                      {:else}
                        <Icon
                          icon="pixelarticons:checkbox-on"
                          class="checkbox-icon"
                        />
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>
            </section>
          {/each}
        </div>
      {:else}
        <div class="spinner-wrapper" id="loading-spinner">
          <Spinner />
        </div>
      {/if}
    </div>
  </main>
</div>

<style>
  .avatar-select-container {
    background-color: var(--m3c-background);
    color: var(--m3c-on-background);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .app-bar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background-color: var(--m3c-surface-container);
    border-bottom: 1px solid var(--m3c-outline-variant);
  }

  .app-bar-title {
    font-family: var(--m3-font);
    font-size: 1.5rem;
    line-height: 1.2;
    font-weight: 500;
    color: var(--m3c-on-background);
    margin: 0;
  }

  .app-bar-spacer {
    flex: 1;
  }

  .content-layout {
    max-width: 80rem;
    margin: 0 auto;
    width: 100%;
    padding: 2rem 1.5rem;
    display: grid;
    grid-template-columns: 1fr;
    gap: 2.5rem;
    box-sizing: border-box;
  }

  @media (min-width: 768px) {
    .content-layout {
      grid-template-columns: 320px 1fr;
      align-items: start;
    }
  }

  @media (min-width: 1024px) {
    .content-layout {
      grid-template-columns: 380px 1fr;
    }
  }

  .preview-column {
    width: 100%;
  }

  /* Style Card container for preview */
  .preview-column :global(.m3-card) {
    background-color: var(--m3c-surface-container-low) !important;
    border-color: var(--m3c-outline-variant) !important;
    border-radius: var(--m3-shape-large) !important;
  }

  .preview-card-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .canvas-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .avatar-canvas {
    margin-top: -5rem;
    width: 100%;
    max-width: 320px;
    aspect-ratio: 1 / 1;
    border-radius: var(--m3-shape-medium);
    cursor: pointer;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .avatar-canvas:hover {
    transform: scale(1.02);
  }

  .avatar-canvas:active {
    transform: scale(0.98);
  }

  .preview-status {
    display: flex;
    flex-direction: row;
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
    font-family: var(--m3-font);
    font-size: 0.875rem;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.75rem;
    border-radius: var(--m3-shape-full);
    background-color: var(--m3c-surface-container-high);
    color: var(--m3c-on-surface-variant);
  }

  .status-badge.save-status {
    background-color: var(--m3c-primary-container);
    color: var(--m3c-on-primary-container);
  }

  :global(.badge-icon) {
    font-size: 1.125rem;
  }

  .items-column {
    width: 100%;
  }

  .categories-list {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .category-section {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
  }

  .category-title {
    font-family: var(--m3-font);
    font-size: 1.5rem;
    font-weight: 500;
    margin: 0;
    color: var(--m3c-on-background);
  }

  .category-divider {
    flex: 1;
    height: 1px;
    background-color: var(--m3c-outline-variant);
    border-radius: var(--m3-shape-full);
    opacity: 0.4;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 1rem;
  }

  .item-button {
    background-color: var(--item-bg);
    border-radius: var(--m3-shape-medium);
    padding: 1rem;
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    cursor: pointer;
    border: 3px solid transparent;
    transition:
      transform 0.2s var(--m3-easing-standard),
      box-shadow 0.2s var(--m3-easing-standard),
      border-color 0.2s var(--m3-easing-standard);
    position: relative;
    overflow: hidden;
  }

  .item-button::before {
    content: "";
    position: absolute;
    inset: 0;
    background-color: #ffffff;
    opacity: 0;
    transition: opacity 0.15s linear;
  }

  .item-button:hover::before {
    opacity: 0.1;
  }

  .item-button:focus-visible {
    outline: 2px solid var(--m3c-primary);
    outline-offset: 2px;
  }

  .item-button.selected {
    border-color: #ffffff;
    box-shadow:
      0 0 0 3px var(--m3c-primary),
      var(--m3-elevation-2);
    transform: scale(1.02);
  }

  .item-name {
    font-family: var(--m3-font);
    font-size: 0.95rem;
    font-weight: 500;
    line-height: 1.3;
    color: #ffffff;
    z-index: 1;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  }

  .checkbox-wrapper {
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global(.checkbox-icon) {
    font-size: 1.5rem;
    color: rgba(255, 255, 255, 0.7);
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
    transition:
      color 0.2s ease,
      transform 0.2s ease;
  }

  .item-button.selected :global(.checkbox-icon) {
    color: #ffffff;
    transform: scale(1.1);
  }

  .spinner-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
    width: 100%;
  }

  @keyframes pop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.08);
    }
    100% {
      transform: scale(1);
    }
  }

  :global(.pop-anim) {
    animation: pop 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }
</style>
