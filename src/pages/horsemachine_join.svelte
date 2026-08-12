<script lang="ts">
  import { gameClient, gameState } from '$lib/wsapi/gameClient';
  import { get } from 'svelte/store';
  import {
    DEFAULT_HORSE_ATTRIBUTES,
    DEFAULT_PRESET_HORSES,
    type HorseAttributes,
  } from '../lib/components/horse/types';

  let selectedPresetIndex = 0;
  let customAttrs: HorseAttributes = JSON.parse(
    JSON.stringify(DEFAULT_PRESET_HORSES[0] || DEFAULT_HORSE_ATTRIBUTES)
  );

  let submitted = false;

  function selectPreset(index: number) {
    selectedPresetIndex = index;
    customAttrs = JSON.parse(JSON.stringify(DEFAULT_PRESET_HORSES[index]));
  }

  function submitHorse() {
    submitted = true;
    gameClient.sendInput({
      type: 'join_horse',
      attributes: customAttrs,
    });
  }
</script>

<div className="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 overflow-y-auto">
  <!-- Header -->
  <header className="text-center py-3 border-b border-slate-800">
    <h1 className="text-2xl font-black text-amber-400 tracking-wider uppercase">
      🏇 HORSE MACHINE
    </h1>
    <p className="text-xs font-semibold text-slate-400">
      Build your horse & spit it into the 3D machine!
    </p>
  </header>

  {#if !submitted}
    <!-- Preset Selection Carousel -->
    <div className="flex flex-col gap-3 my-3">
      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
        SELECT RACING PRESET
      </label>
      <div className="grid grid-cols-2 gap-2">
        {#each DEFAULT_PRESET_HORSES as preset, i}
          <button
            on:click={() => selectPreset(i)}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              selectedPresetIndex === i
                ? 'border-amber-400 bg-amber-500/20 text-white scale-102'
                : 'border-slate-800 bg-slate-900 text-slate-300'
            }`}
          >
            <div className="font-extrabold text-sm truncate">{preset.name}</div>
            <div className="text-[10px] font-mono text-amber-400 mt-1">
              ⚡{preset.speed} 🫀{preset.stamina} 🥊{preset.aggression}
            </div>
          </button>
        {/each}
      </div>
    </div>

    <!-- Attribute Sliders -->
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
      <div>
        <label className="text-xs font-bold text-slate-300">HORSE NAME</label>
        <input
          type="text"
          bind:value={customAttrs.name}
          className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-400"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs font-bold text-slate-300">
          <span>SPEED</span>
          <span className="text-amber-400">{customAttrs.speed}</span>
        </div>
        <input
          type="range"
          min="20"
          max="100"
          bind:value={customAttrs.speed}
          className="w-full accent-amber-400 mt-1"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs font-bold text-slate-300">
          <span>STAMINA</span>
          <span className="text-emerald-400">{customAttrs.stamina}</span>
        </div>
        <input
          type="range"
          min="20"
          max="100"
          bind:value={customAttrs.stamina}
          className="w-full accent-emerald-400 mt-1"
        />
      </div>

      <div>
        <div className="flex justify-between text-xs font-bold text-slate-300">
          <span>AGGRESSION</span>
          <span className="text-red-400">{customAttrs.aggression}</span>
        </div>
        <input
          type="range"
          min="20"
          max="100"
          bind:value={customAttrs.aggression}
          className="w-full accent-red-400 mt-1"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <button
      on:click={submitHorse}
      className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-2xl text-lg uppercase tracking-wider shadow-xl my-4 active:scale-95 transition-all"
    >
      🚀 SPIT HORSE INTO MACHINE!
    </button>
  {:else}
    <!-- Submitted Waiting Screen -->
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-4">
      <div className="w-20 h-20 rounded-full border-4 border-amber-400 border-t-transparent animate-spin flex items-center justify-center text-3xl">
        🏇
      </div>
      <h2 className="text-xl font-extrabold text-amber-400 uppercase tracking-wide">
        HORSE SPIT INTO MACHINE!
      </h2>
      <p className="text-sm font-medium text-slate-400">
        Look up at the TV screen! Your horse is landing on the derby track!
      </p>
    </div>
  {/if}
</div>
