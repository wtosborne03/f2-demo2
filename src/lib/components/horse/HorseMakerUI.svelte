<script lang="ts">
  import {
    HORSE_PRESETS,
    type HorseAttributes,
    type PatternType,
  } from "./types";
  import Icon from "@iconify/svelte";

  export let attributes: HorseAttributes;

  let activeTab: "stats" | "colors" | "personality" = "stats";

  const patternOptions: { id: PatternType; label: string }[] = [
    { id: "solid", label: "Solid" },
    { id: "pinto", label: "Pinto" },
    { id: "dappled", label: "Dapple" },
    { id: "socks", label: "Socks" },
    { id: "metallic", label: "Cyber" },
  ];

  const personalityPrompts = [
    "A fierce competitor with an explosive turn of foot.",
    "Quiet and focused. Unyielding stamina on long tracks.",
    "Wild mustang energy with a fiery sprint impulse.",
    "Majestic show horse bred for precision and elegance.",
  ];

  function applyPreset(presetId: string) {
    const found = HORSE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      attributes = JSON.parse(JSON.stringify(found.attributes));
    }
  }

  function randomizeAttributes() {
    const randomHex = () =>
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0");
    const patterns: PatternType[] = [
      "solid",
      "pinto",
      "dappled",
      "socks",
      "metallic",
    ];
    const randStep = () => Math.floor(Math.random() * 11) * 10; // 0 to 100 in steps of 10

    attributes.speed = randStep();
    attributes.stamina = randStep();
    attributes.aggression = randStep();
    attributes.elegance = randStep();
    attributes.height = randStep();
    attributes.coatColor = randomHex();
    attributes.patternColor = randomHex();
    attributes.maneColor = randomHex();
    attributes.hoofColor = randomHex();
    attributes.patternType =
      patterns[Math.floor(Math.random() * patterns.length)];
    attributes.coatSheen = randStep();
  }
</script>

<div
  class="bg-slate-900/95 backdrop-blur-md border-t border-x border-white/15 rounded-t-2xl sm:rounded-t-3xl rounded-b-none border-b-0 shadow-2xl w-full flex flex-col overflow-hidden"
>
  <!-- Joined Tab Bar Header -->
  <div
    class="bg-slate-950/60 p-2 border-b border-white/10 flex items-center justify-between gap-1.5 w-full"
  >
    <div
      role="tablist"
      class="tabs tabs-boxed bg-transparent p-0 flex-1 flex items-center"
    >
      <button
        role="tab"
        class="tab flex-1 font-extrabold text-sm py-2 transition-all {activeTab ===
        'stats'
          ? 'tab-active bg-primary text-white shadow-md'
          : 'text-slate-300 hover:text-white'}"
        on:click={() => (activeTab = "stats")}
      >
        Stats
      </button>
      <button
        role="tab"
        class="tab flex-1 font-extrabold text-sm py-2 transition-all {activeTab ===
        'colors'
          ? 'tab-active bg-primary text-white shadow-md'
          : 'text-slate-300 hover:text-white'}"
        on:click={() => (activeTab = "colors")}
      >
        Colors
      </button>
      <button
        role="tab"
        class="tab flex-1 font-extrabold text-sm py-2 transition-all {activeTab ===
        'personality'
          ? 'tab-active bg-primary text-white shadow-md'
          : 'text-slate-300 hover:text-white'}"
        on:click={() => (activeTab = "personality")}
      >
        Personality
      </button>
    </div>

    <!-- Randomize Action Button -->
    <button
      class="btn btn-warning btn-sm gap-1 font-extrabold shadow-md ml-1"
      on:click={randomizeAttributes}
      title="Randomize Attributes"
    >
      <Icon icon="mdi:dice-5-outline" class="text-base" />
      Random
    </button>
  </div>

  <!-- Tab Content Card with Consistent Fixed Height (280px) across all 3 Tabs -->
  <div
    class="p-4 sm:p-5 h-[280px] flex flex-col justify-center w-full overflow-y-auto"
  >
    {#if activeTab === "stats"}
      <!-- TAB 1: PHYSICAL STAT SLIDERS -->
      <div class="flex flex-col gap-3.5 justify-center h-full">
        <!-- Speed Slider -->
        <div class="flex items-center gap-3">
          <label
            class="text-sm font-bold text-slate-100 w-28 shrink-0 flex items-center gap-2"
          >
            <span>⚡ Speed</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            bind:value={attributes.speed}
            class="range range-error range-md cursor-pointer flex-1"
          />
        </div>

        <!-- Stamina Slider -->
        <div class="flex items-center gap-3">
          <label
            class="text-sm font-bold text-slate-100 w-28 shrink-0 flex items-center gap-2"
          >
            <span>🫁 Stamina</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            bind:value={attributes.stamina}
            class="range range-warning range-md cursor-pointer flex-1"
          />
        </div>

        <!-- Aggression Slider -->
        <div class="flex items-center gap-3">
          <label
            class="text-sm font-bold text-slate-100 w-28 shrink-0 flex items-center gap-2"
          >
            <span>🔥 Aggression</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            bind:value={attributes.aggression}
            class="range range-accent range-md cursor-pointer flex-1"
          />
        </div>

        <!-- Elegance Slider -->
        <div class="flex items-center gap-3">
          <label
            class="text-sm font-bold text-slate-100 w-28 shrink-0 flex items-center gap-2"
          >
            <span>👑 Elegance</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            bind:value={attributes.elegance}
            class="range range-info range-md cursor-pointer flex-1"
          />
        </div>

        <!-- Height Slider -->
        <div class="flex items-center gap-3">
          <label
            class="text-sm font-bold text-slate-100 w-28 shrink-0 flex items-center gap-2"
          >
            <span>📏 Height</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            bind:value={attributes.height}
            class="range range-md cursor-pointer flex-1"
          />
        </div>
      </div>
    {:else if activeTab === "colors"}
      <!-- TAB 2: COAT PATTERNS & COLOR PICKERS -->
      <div class="flex flex-col gap-4 justify-center h-full">
        <!-- Pattern Selection Join Buttons -->
        <div class="flex flex-col gap-1.5">
          <label
            class="text-xs font-bold text-slate-200 uppercase tracking-wider"
            >Coat Pattern</label
          >
          <div class="join w-full">
            {#each patternOptions as opt}
              <button
                class="join-item btn btn-sm flex-1 font-bold {attributes.patternType ===
                opt.id
                  ? 'btn-primary'
                  : 'btn-neutral'}"
                on:click={() => (attributes.patternType = opt.id)}
              >
                {opt.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Color Pickers Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div
            class="flex flex-col gap-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/10"
          >
            <span class="text-xs font-bold text-slate-200">Primary Coat</span>
            <div class="flex items-center gap-2">
              <input
                type="color"
                bind:value={attributes.coatColor}
                class="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span class="text-xs font-mono text-slate-300 uppercase font-bold"
                >{attributes.coatColor}</span
              >
            </div>
          </div>

          <div
            class="flex flex-col gap-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/10"
          >
            <span class="text-xs font-bold text-slate-200">Pattern Accent</span>
            <div class="flex items-center gap-2">
              <input
                type="color"
                bind:value={attributes.patternColor}
                class="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span class="text-xs font-mono text-slate-300 uppercase font-bold"
                >{attributes.patternColor}</span
              >
            </div>
          </div>

          <div
            class="flex flex-col gap-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/10"
          >
            <span class="text-xs font-bold text-slate-200">Mane & Tail</span>
            <div class="flex items-center gap-2">
              <input
                type="color"
                bind:value={attributes.maneColor}
                class="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span class="text-xs font-mono text-slate-300 uppercase font-bold"
                >{attributes.maneColor}</span
              >
            </div>
          </div>

          <div
            class="flex flex-col gap-1 bg-slate-950/70 p-2.5 rounded-xl border border-white/10"
          >
            <span class="text-xs font-bold text-slate-200">Hooves</span>
            <div class="flex items-center gap-2">
              <input
                type="color"
                bind:value={attributes.hoofColor}
                class="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
              />
              <span class="text-xs font-mono text-slate-300 uppercase font-bold"
                >{attributes.hoofColor}</span
              >
            </div>
          </div>
        </div>
      </div>
    {:else if activeTab === "personality"}
      <!-- TAB 3: PERSONALITY & NAME -->
      <div class="flex flex-col gap-3 justify-start h-full">
        <!-- Archetype Preset Selector & Name Input Grid -->
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label
              class="text-xs font-bold text-slate-200 uppercase tracking-wider"
              >Name</label
            >
            <input
              type="text"
              bind:value={attributes.name}
              placeholder="Horse name..."
              class="input input-bordered input-sm w-full font-bold text-xs bg-slate-950 text-white border-white/20"
            />
          </div>
        </div>

        <!-- Personality Text Area -->
        <div class="flex flex-col gap-1">
          <label
            class="text-xs font-bold text-slate-200 uppercase tracking-wider"
            >Personality</label
          >
          <textarea
            bind:value={attributes.personality}
            rows="2"
            placeholder="Describe your horse's unique character traits..."
            class="textarea textarea-bordered textarea-xs w-full text-xs leading-relaxed bg-slate-950 text-slate-200 border-white/20 resize-none"
          ></textarea>
        </div>
      </div>
    {/if}
  </div>
</div>
