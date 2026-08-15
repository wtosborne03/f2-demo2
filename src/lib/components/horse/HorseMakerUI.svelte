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
  class="bg-slate-900/95 backdrop-blur-md border-t border-x border-white/20 rounded-t-3xl border-b-0 shadow-2xl w-full flex flex-col p-4 sm:p-5 gap-3.5 sm:gap-4 text-slate-100"
>
  <!-- 1. Large Horse Name Input + Dice Button -->
  <div class="flex items-center gap-2.5">
    <div class="relative flex-1">
      <input
        type="text"
        bind:value={attributes.name}
        placeholder="Name your horse..."
        maxlength="20"
        class="input input-md sm:input-lg input-bordered w-full h-12 sm:h-14 bg-slate-950/80 text-slate-100 font-black text-base sm:text-lg border-white/20 focus:border-amber-400 pl-4 pr-10 rounded-2xl shadow-inner tracking-wide"
      />
      <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-base opacity-50 font-mono">🏇</span>
    </div>

    <button
      type="button"
      on:click={randomizeAll}
      class="btn btn-warning h-12 sm:h-14 px-4 sm:px-5 font-black gap-2 shadow-lg uppercase tracking-wider shrink-0 rounded-2xl active:scale-95 transition-transform"
      title="Randomize Horse"
    >
      <Icon icon="mdi:dice-5-outline" class="text-xl sm:text-2xl" />
      <span class="text-xs sm:text-sm">Random</span>
    </button>
  </div>

  <!-- 2. Large Touch-Friendly Colors & Pattern Box -->
  <div class="flex flex-col gap-2.5 bg-slate-950/70 p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-sm">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <!-- 2 Color Inputs with clear labels & large tap targets -->
      <div class="flex items-center gap-4">
        <!-- Primary Coat Color Picker -->
        <label class="flex items-center gap-2 cursor-pointer group" title="Tap to pick coat color">
          <div class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-white/30 shadow-md group-hover:border-amber-400 transition-colors">
            <input
              type="color"
              bind:value={attributes.coatColor}
              class="absolute -inset-2 w-14 h-14 cursor-pointer bg-transparent border-0 opacity-0"
            />
            <div class="w-full h-full" style="background-color: {attributes.coatColor};"></div>
          </div>
          <span class="text-xs sm:text-sm font-extrabold text-slate-200 uppercase tracking-wide">Coat</span>
        </label>

        <!-- Accent / Pattern Color Picker -->
        <label class="flex items-center gap-2 cursor-pointer group" title="Tap to pick accent color">
          <div class="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-white/30 shadow-md group-hover:border-amber-400 transition-colors">
            <input
              type="color"
              bind:value={attributes.patternColor}
              class="absolute -inset-2 w-14 h-14 cursor-pointer bg-transparent border-0 opacity-0"
            />
            <div class="w-full h-full" style="background-color: {attributes.patternColor};"></div>
          </div>
          <span class="text-xs sm:text-sm font-extrabold text-slate-200 uppercase tracking-wide">Accent</span>
        </label>
      </div>

      <!-- Quick Coat Palette Swatches -->
      <div class="flex items-center gap-1.5 ml-auto">
        {#each coatPresets as preset}
          <button
            type="button"
            on:click={() => {
              attributes.coatColor = preset.coat;
              attributes.patternColor = preset.accent;
            }}
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white/40 shadow-sm transition-all hover:scale-110 active:scale-95"
            style="background: {preset.coat};"
            title={preset.label}
          ></button>
        {/each}
      </div>
    </div>

    <!-- Chunky Pattern Selection Pills -->
    <div class="grid grid-cols-4 gap-1.5 pt-1">
      {#each patternOptions as opt}
        <button
          type="button"
          class="py-2 sm:py-2.5 px-2 text-xs sm:text-sm font-black rounded-xl transition-all border text-center {attributes.patternType === opt.id
            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md scale-[1.02]'
            : 'bg-slate-800/90 text-slate-300 border-white/10 hover:bg-slate-750 active:scale-98'}"
          on:click={() => (attributes.patternType = opt.id)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- 3. Balanced Stat Sliders (Speed, Stamina, Agility) -->
  <div class="flex flex-col gap-3 bg-slate-950/70 p-3.5 sm:p-4 rounded-2xl border border-white/10 shadow-sm">
    <div class="flex items-center justify-between pb-0.5">
      <span class="text-xs sm:text-sm font-black text-slate-300 uppercase tracking-wider">Stat Allocation</span>
      <span class="text-xs sm:text-sm font-mono font-black text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
        150 PTS TOTAL
      </span>
    </div>

    <!-- Speed Slider -->
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-between w-28 sm:w-32 shrink-0">
        <span class="text-xs sm:text-sm font-black text-slate-200">⚡ Speed</span>
        <span class="text-xs sm:text-sm font-mono font-black text-red-400 bg-red-400/10 border border-red-400/30 px-2 py-0.5 rounded-md min-w-[28px] text-center">
          {attributes.speed ?? 50}
        </span>
      </div>
      <input
        type="range"
        min={MIN_STAT}
        max={MAX_STAT}
        step="1"
        value={attributes.speed ?? 50}
        on:input={(e) => handleStatSlider("speed", e)}
        class="range range-sm sm:range-md range-error cursor-pointer flex-1 h-6"
      />
    </div>

    <!-- Stamina Slider -->
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-between w-28 sm:w-32 shrink-0">
        <span class="text-xs sm:text-sm font-black text-slate-200">🫁 Stamina</span>
        <span class="text-xs sm:text-sm font-mono font-black text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-md min-w-[28px] text-center">
          {attributes.stamina ?? 50}
        </span>
      </div>
      <input
        type="range"
        min={MIN_STAT}
        max={MAX_STAT}
        step="1"
        value={attributes.stamina ?? 50}
        on:input={(e) => handleStatSlider("stamina", e)}
        class="range range-sm sm:range-md range-success cursor-pointer flex-1 h-6"
      />
    </div>

    <!-- Agility Slider -->
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-between w-28 sm:w-32 shrink-0">
        <span class="text-xs sm:text-sm font-black text-slate-200">🤸 Agility</span>
        <span class="text-xs sm:text-sm font-mono font-black text-sky-400 bg-sky-400/10 border border-sky-400/30 px-2 py-0.5 rounded-md min-w-[28px] text-center">
          {attributes.height ?? 50}
        </span>
      </div>
      <input
        type="range"
        min={MIN_STAT}
        max={MAX_STAT}
        step="1"
        value={attributes.height ?? 50}
        on:input={(e) => handleStatSlider("agility", e)}
        class="range range-sm sm:range-md range-info cursor-pointer flex-1 h-6"
      />
    </div>
  </div>
</div>
