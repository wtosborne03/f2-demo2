<script lang="ts">
  import { gameClient, gameState } from '$lib/wsapi/gameClient';
  import { get } from 'svelte/store';

  let whipCooldown = false;
  let steroidCooldown = false;

  function moveLane(direction: number) {
    gameClient.sendInput({
      type: 'lane_change',
      direction,
    });
  }

  function triggerWhip() {
    if (whipCooldown) return;
    whipCooldown = true;
    gameClient.sendInput({
      type: 'whip',
    });
    setTimeout(() => {
      whipCooldown = false;
    }, 1500);
  }

  function triggerSteroid() {
    if (steroidCooldown) return;
    steroidCooldown = true;
    gameClient.sendInput({
      type: 'steroid',
    });
    setTimeout(() => {
      steroidCooldown = false;
    }, 3000);
  }
</script>

<div class="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 select-none">
  <!-- Header -->
  <header class="flex items-center justify-between border-b border-slate-800 pb-3">
    <div class="flex items-center gap-2">
      <span class="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
      <span class="font-black text-sm text-amber-400 tracking-wider">DERBY RACE LIVE</span>
    </div>
    <span class="text-xs font-mono font-bold text-slate-400">TOUCH CONTROLLER</span>
  </header>

  <!-- Middle: Lane Change Controls -->
  <div class="flex-1 flex flex-col justify-center gap-4 my-4">
    <div class="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
      SWIPE / TAP TO SWITCH LANES
    </div>

    <div class="grid grid-cols-2 gap-4">
      <button
        on:click={() => moveLane(-1)}
        class="py-12 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border-2 border-slate-700 active:border-amber-400 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all"
      >
        <span class="text-5xl">⬅️</span>
        <span class="font-black text-lg text-white uppercase">LANE LEFT</span>
      </button>

      <button
        on:click={() => moveLane(1)}
        class="py-12 bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border-2 border-slate-700 active:border-amber-400 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all"
      >
        <span class="text-5xl">➡️</span>
        <span class="font-black text-lg text-white uppercase">LANE RIGHT</span>
      </button>
    </div>
  </div>

  <!-- Bottom Action Buttons: Whip & Steroid Rage -->
  <div class="grid grid-cols-2 gap-4 mb-2">
    <!-- Whip Button -->
    <button
      on:click={triggerWhip}
      disabled={whipCooldown}
      class={`py-5 rounded-2xl font-black text-lg uppercase tracking-wider shadow-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
        whipCooldown
          ? 'bg-slate-800 text-slate-500 border border-slate-700'
          : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-2 border-white'
      }`}
    >
      <span class="text-2xl">🔥</span>
      <span>{whipCooldown ? 'BURNING...' : 'WHIP BOOST'}</span>
    </button>

    <!-- Steroid Button -->
    <button
      on:click={triggerSteroid}
      disabled={steroidCooldown}
      class={`py-5 rounded-2xl font-black text-lg uppercase tracking-wider shadow-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all ${
        steroidCooldown
          ? 'bg-slate-800 text-slate-500 border border-slate-700'
          : 'bg-gradient-to-r from-red-600 to-pink-600 text-white border-2 border-white animate-pulse'
      }`}
    >
      <span class="text-2xl">⚡</span>
      <span>{steroidCooldown ? 'RECHARGING...' : 'STEROID RAGE'}</span>
    </button>
  </div>
</div>
