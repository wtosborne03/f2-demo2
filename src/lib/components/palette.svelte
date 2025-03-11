<script>
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let colors = ["#d7c44c", "#d7c44c", "#4fa9cc", "#3f8d27"];

  export let paletteColor;
  export let background = "#fff";
</script>

<section>
  <div>
    {#each colors as color}
      <button
        on:click={() => {
          dispatch("color", { color });
          paletteColor = color;
        }}
        style:background={color}
      >
      </button>
    {/each}
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
    gap: 0 1rem;
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
  }

  section > svg {
    display: block;
  }
</style>
