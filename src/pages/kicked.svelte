<script lang="ts">
  import { gameState } from "$lib/wsapi/gameClient";
  import Icon from "@iconify/svelte";

  const handleReturnHome = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("code");
      localStorage.removeItem("couch_room");
      localStorage.removeItem("couch_pid");
      window.location.href = "/";
    }
  };
</script>

<div
  class="flex flex-col justify-center items-center h-full w-full max-w-md mx-auto px-6 text-center space-y-6 select-none my-auto"
>
  <!-- Animated / Glowing Kicked Icon Badge -->
  <div class="relative flex items-center justify-center">
    <div
      class="absolute -inset-3 rounded-full bg-gradient-to-r from-red-600/30 to-amber-600/30 blur-xl opacity-75 animate-pulse"
    ></div>
    <div
      class="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-slate-900/90 border-2 border-red-500/40 shadow-2xl text-red-400"
    >
      <Icon icon="mingcute:user-x-fill" class="text-6xl" />
    </div>
  </div>

  <!-- Title and Details -->
  <div class="space-y-2">
    <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
      You've Been Kicked
    </h1>
    <p class="text-base text-slate-300 font-medium max-w-xs mx-auto leading-relaxed">
      {$gameState.page_data?.reason || "The game host removed you from the lobby."}
    </p>
  </div>

  <!-- Status Card -->
  <div
    class="w-full max-w-xs py-3 px-4 rounded-2xl bg-red-950/30 border border-red-500/20 text-red-300 text-xs font-semibold tracking-wide uppercase"
  >
    Disconnected from Room
  </div>

  <!-- Action Button -->
  <button
    type="button"
    class="btn btn-primary btn-lg w-full max-w-xs font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
    onclick={handleReturnHome}
  >
    <Icon icon="mingcute:home-4-fill" class="text-2xl" />
    <span>Join Another Game</span>
  </button>
</div>
