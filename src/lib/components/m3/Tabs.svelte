<script lang="ts">
  interface TabItem {
    name: string;
    value: any;
    icon?: any;
  }

  interface Props {
    items: TabItem[];
    tab: any;
    secondary?: boolean;
  }

  let {
    items,
    tab = $bindable(),
    secondary = false
  }: Props = $props();
</script>

<div class="tabs tabs-box bg-base-200 p-1 rounded-xl w-full flex">
  {#each items as item}
    <button
      type="button"
      class="tab flex-1 font-medium transition-all"
      class:tab-active={tab === item.value}
      onclick={() => { tab = item.value; }}
    >
      {#if item.icon}
        <span class="mr-1">{@render item.icon()}</span>
      {/if}
      <span>{item.name}</span>
    </button>
  {/each}
</div>
