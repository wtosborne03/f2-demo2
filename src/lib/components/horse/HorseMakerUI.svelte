<script lang="ts">
  import type { HorseAttributes, PatternType } from "./types";
  import Icon from "@iconify/svelte";

  export let attributes: HorseAttributes;

  const TOTAL_BUDGET = 150;
  const MIN_STAT = 10;
  const MAX_STAT = 90;

  // Initialize stats to 50 / 50 / 50 if needed
  if (!attributes.speed && attributes.speed !== 0) attributes.speed = 50;
  if (!attributes.stamina && attributes.stamina !== 0) attributes.stamina = 50;
  if (!attributes.height && attributes.height !== 0) attributes.height = 50; // 'height' acts as agility

  const patternOptions: { id: PatternType; label: string }[] = [
    { id: "solid", label: "Solid" },
    { id: "pinto", label: "Pinto" },
    { id: "dappled", label: "Dapple" },
    { id: "socks", label: "Socks" },
  ];

  const coatPresets = [
    { label: "Chestnut", coat: "#854d0e", accent: "#ffffff" },
    { label: "Obsidian", coat: "#18181b", accent: "#3f3f46" },
    { label: "Golden", coat: "#d97706", accent: "#fef3c7" },
    { label: "Crimson", coat: "#dc2626", accent: "#fca5a5" },
    { label: "Sapphire", coat: "#2563eb", accent: "#93c5fd" },
  ];

  const horseNames = [
    "Thunder Bolt", "Velvet Dash", "Red Comet", "Shadow Blitz",
    "Golden Glory", "Iron Gallop", "Silver Wind", "Midnight Rush",
    "Turbo Mustang", "Blaze Runner", "Cosmic Stride", "Night Hawk"
  ];

  function randomizeAll() {
    const randomName = horseNames[Math.floor(Math.random() * horseNames.length)];
    const randomPreset = coatPresets[Math.floor(Math.random() * coatPresets.length)];
    const randomPattern = patternOptions[Math.floor(Math.random() * patternOptions.length)].id;

    attributes.name = randomName;
    attributes.coatColor = randomPreset.coat;
    attributes.patternColor = randomPreset.accent;
    attributes.maneColor = "#18181b";
    attributes.hoofColor = "#27272a";
    attributes.patternType = randomPattern;

    // Balanced random distribution of 150 points
    const r1 = Math.floor(Math.random() * 50) + 20;
    const r2 = Math.floor(Math.random() * (TOTAL_BUDGET - r1 - 30)) + 15;
    const r3 = TOTAL_BUDGET - r1 - r2;

    attributes.speed = r1;
    attributes.stamina = r2;
    attributes.height = r3; // Agility
  }

  function handleStatSlider(statKey: "speed" | "stamina" | "agility", event: Event) {
    const target = event.target as HTMLInputElement;
    let newVal = parseInt(target.value, 10);
    if (isNaN(newVal)) return;
    newVal = Math.max(MIN_STAT, Math.min(MAX_STAT, newVal));

    const curSpeed = attributes.speed ?? 50;
    const curStamina = attributes.stamina ?? 50;
    const curAgility = attributes.height ?? 50;

    let otherStats: { key: "speed" | "stamina" | "agility"; val: number }[] = [];
    if (statKey === "speed") {
      otherStats = [
        { key: "stamina", val: curStamina },
        { key: "agility", val: curAgility },
      ];
    } else if (statKey === "stamina") {
      otherStats = [
        { key: "speed", val: curSpeed },
        { key: "agility", val: curAgility },
      ];
    } else {
      otherStats = [
        { key: "speed", val: curSpeed },
        { key: "stamina", val: curStamina },
      ];
    }

    const remaining = TOTAL_BUDGET - newVal;
    const otherSum = otherStats[0].val + otherStats[1].val;

    if (otherSum <= 0) {
      otherStats[0].val = Math.round(remaining / 2);
      otherStats[1].val = remaining - otherStats[0].val;
    } else {
      const ratio = otherStats[0].val / otherSum;
      let newO0 = Math.round(remaining * ratio);
      let newO1 = remaining - newO0;

      if (newO0 < MIN_STAT) {
        newO0 = MIN_STAT;
        newO1 = remaining - MIN_STAT;
      } else if (newO1 < MIN_STAT) {
        newO1 = MIN_STAT;
        newO0 = remaining - MIN_STAT;
      }

      if (newO0 > MAX_STAT) {
        newO0 = MAX_STAT;
        newO1 = remaining - MAX_STAT;
      } else if (newO1 > MAX_STAT) {
        newO1 = MAX_STAT;
        newO0 = remaining - MAX_STAT;
      }

      otherStats[0].val = newO0;
      otherStats[1].val = newO1;
    }

    if (statKey === "speed") {
      attributes.speed = newVal;
      attributes.stamina = otherStats[0].val;
      attributes.height = otherStats[1].val;
    } else if (statKey === "stamina") {
      attributes.stamina = newVal;
      attributes.speed = otherStats[0].val;
      attributes.height = otherStats[1].val;
    } else {
      attributes.height = newVal;
      attributes.speed = otherStats[0].val;
      attributes.stamina = otherStats[1].val;
    }
  }
</script>

<div
  class="bg-slate-900/95 backdrop-blur-md border-t border-x border-white/15 rounded-t-2xl sm:rounded-t-3xl rounded-b-none border-b-0 shadow-2xl w-full flex flex-col p-3.5 sm:p-4 gap-3 text-slate-100"
>
  <!-- 1. Horse Name Input + Randomizer -->
  <div class="flex items-center gap-2">
    <div class="relative flex-1">
      <input
        type="text"
        bind:value={attributes.name}
        placeholder="Name your horse..."
        maxlength="20"
        class="input input-sm sm:input-md input-bordered w-full bg-slate-950/70 text-slate-100 font-extrabold text-sm sm:text-base border-white/20 focus:border-amber-400 pl-3 pr-8 shadow-inner"
      />
      <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs opacity-40 font-mono">🏇</span>
    </div>

    <button
      type="button"
      on:click={randomizeAll}
      class="btn btn-sm btn-warning font-black gap-1 shadow-md uppercase tracking-wider shrink-0"
      title="Randomize Horse"
    >
      <Icon icon="mdi:dice-5-outline" class="text-base" />
      <span class="hidden xs:inline">Random</span>
    </button>
  </div>

  <!-- 2. Colors & Pattern in One Compact Row -->
  <div class="flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
    <div class="flex items-center justify-between gap-2">
      <!-- 2 Color Inputs: Coat & Accent -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5" title="Coat Color">
          <input
            type="color"
            bind:value={attributes.coatColor}
            class="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent shadow-sm"
          />
          <span class="text-[11px] font-bold text-slate-300 uppercase">Coat</span>
        </div>

        <div class="flex items-center gap-1.5" title="Accent Color">
          <input
            type="color"
            bind:value={attributes.patternColor}
            class="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent shadow-sm"
          />
          <span class="text-[11px] font-bold text-slate-300 uppercase">Accent</span>
        </div>
      </div>

      <!-- Quick Coat Swatches -->
      <div class="flex items-center gap-1">
        {#each coatPresets as preset}
          <button
            type="button"
            on:click={() => {
              attributes.coatColor = preset.coat;
              attributes.patternColor = preset.accent;
            }}
            class="w-5 h-5 rounded-full border border-white/30 shadow-xs transition-transform active:scale-90"
            style="background: {preset.coat};"
            title={preset.label}
          ></button>
        {/each}
      </div>
    </div>

    <!-- Pattern Pills -->
    <div class="flex items-center gap-1 mt-0.5">
      {#each patternOptions as opt}
        <button
          type="button"
          class="flex-1 py-1 text-[11px] font-bold rounded-lg transition-all border {attributes.patternType === opt.id
            ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
            : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700'}"
          on:click={() => (attributes.patternType = opt.id)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- 3. Balanced Stat Sliders (Speed, Stamina, Agility) with 150pt Budget -->
  <div class="flex flex-col gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/10">
    <div class="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-0.5">
      <span>Balanced Attributes</span>
      <span class="text-amber-400 font-mono">150 PTS TOTAL</span>
    </div>

    <!-- Speed Slider -->
    <div class="flex items-center gap-2.5">
      <div class="flex items-center justify-between w-24 shrink-0 text-xs font-extrabold text-slate-200">
        <span>⚡ Speed</span>
        <span class="font-mono text-amber-400">{attributes.speed ?? 50}</span>
      </div>
      <input
        type="range"
        min={MIN_STAT}
        max={MAX_STAT}
        step="1"
        value={attributes.speed ?? 50}
        on:input={(e) => handleStatSlider("speed", e)}
        class="range range-xs range-error cursor-pointer flex-1"
      />
    </div>

    <!-- Stamina Slider -->
    <div class="flex items-center gap-2.5">
      <div class="flex items-center justify-between w-24 shrink-0 text-xs font-extrabold text-slate-200">
        <span>🫁 Stamina</span>
        <span class="font-mono text-emerald-400">{attributes.stamina ?? 50}</span>
      </div>
      <input
        type="range"
        min={MIN_STAT}
        max={MAX_STAT}
        step="1"
        value={attributes.stamina ?? 50}
        on:input={(e) => handleStatSlider("stamina", e)}
        class="range range-xs range-success cursor-pointer flex-1"
      />
    </div>

    <!-- Agility Slider -->
    <div class="flex items-center gap-2.5">
      <div class="flex items-center justify-between w-24 shrink-0 text-xs font-extrabold text-slate-200">
        <span>🤸 Agility</span>
        <span class="font-mono text-sky-400">{attributes.height ?? 50}</span>
      </div>
      <input
        type="range"
        min={MIN_STAT}
        max={MAX_STAT}
        step="1"
        value={attributes.height ?? 50}
        on:input={(e) => handleStatSlider("agility", e)}
        class="range range-xs range-info cursor-pointer flex-1"
      />
    </div>
  </div>
</div>
