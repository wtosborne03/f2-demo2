<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let colors = ["#d7c44c", "#d7c44c", "#4fa9cc", "#3f8d27"];

  export let paletteColor;
  export let background = "#fff";
</script>

<section>
  <div class="py-3 px-3">
    {#each colors as color}
      <button
        type="button"
        class="color-btn"
        class:selected={paletteColor === color}
        on:click={() => {
          dispatch("color", { color });
          paletteColor = color;
        }}
        style:background={color}
      >
      </button>
    {/each}
    <button
      type="button"
      class="clear-btn"
      on:click={() => dispatch("clear")}
      title="Clear canvas"
    >
      🗑️
    </button>
  </div>
</section>

<style>
  section {
    --size: 2.4rem;
    padding: 0.4rem;
    display: flex;
    align-items: center;
    gap: 8rem;
  }

  section > div {
    flex-grow: 1;
  }

  section > svg {
    flex-shrink: 0;
  }

  div {
    display: flex;
    gap: 0 0.4rem;
    align-items: center;
    overflow-x: auto;
  }

  div::-webkit-scrollbar {
    height: 0.25rem;
  }

  div::-webkit-scrollbar-track {
    background: hsl(0, 0%, 100%);
  }

  div::-webkit-scrollbar-thumb {
    background: currentColor;
  }

  div button {
    flex-shrink: 0;
  }

  button,
  section > svg {
    width: var(--size);
    height: var(--size);
  }

  button {
    cursor: pointer;
    border-radius: 50%;
    margin: 0;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.2s, background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-btn {
    border: 4px rgba(0, 0, 0, 0.21) solid;
  }

  .color-btn.selected {
    transform: scale(1.25);
    border-color: #333;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }

  .clear-btn {
    border: 4px solid #ff6b6b;
    background: white;
    font-size: 1.2rem;
  }

  .clear-btn:hover {
    transform: scale(1.1);
    background: #ffe0e0;
    box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
  }

  .clear-btn:active {
    transform: scale(0.95);
  }

  section > svg {
    display: block;
  }
</style>
