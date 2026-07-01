<script lang="ts">
  import { get } from "svelte/store";
  import { gameClient, gameState } from "$lib/wsapi/gameClient";
  import { fly } from "svelte/transition";

  let m_data: any;
  m_data = get(gameState).page_data;

  let currentIndex = 0;
  let touchStartX = 0;
  let touchEndX = 0;
  let slideDirection = 1; // 1 for right (next), -1 for left (prev)

  $: currentChoice = m_data?.answers?.[currentIndex];

  function handleTouchStart(e: TouchEvent) {
    touchStartX = e.changedTouches[0].screenX;
  }

  function handleTouchEnd(e: TouchEvent) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }

  function handleSwipe() {
    const threshold = 40;
    const diff = touchStartX - touchEndX;
    if (diff > threshold) {
      nextCard();
    } else if (diff < -threshold) {
      prevCard();
    }
  }

  function nextCard() {
    if (m_data?.answers && currentIndex < m_data.answers.length - 1) {
      slideDirection = 1;
      currentIndex++;
    }
  }

  function prevCard() {
    if (currentIndex > 0) {
      slideDirection = -1;
      currentIndex--;
    }
  }

  function submit_vote() {
    gameClient.sendInput({
      type: "multiple_choice",
      answer_index: currentIndex,
    });
  }
</script>

<div class="container h-full mx-auto w-full flex flex-col justify-between items-center p-3 max-w-sm">
  <!-- Header Title -->
  <div class="flex items-center justify-center gap-2 mb-2 select-none">
    <span class="text-3xl animate-pulse">🔮</span>
    <span class="text-lg font-black text-[#e9d5ff] uppercase tracking-widest text-center">Best Twist!</span>
  </div>

  <!-- Swipeable Card -->
  {#if m_data?.answers && m_data.answers.length > 0}
    <div
      role="presentation"
      class="relative w-full flex-grow flex flex-col justify-between bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] border-4 border-[#a855f7] rounded-3xl p-4 shadow-[0_0_25px_rgba(168,85,247,0.35)] overflow-hidden h-[62vh] select-none"
      on:touchstart={handleTouchStart}
      on:touchend={handleTouchEnd}
    >
      {#key currentIndex}
        <div
          in:fly={{ x: slideDirection * 150, duration: 250 }}
          out:fly={{ x: -slideDirection * 150, duration: 250 }}
          class="absolute inset-0 p-4 flex flex-col justify-between"
        >
          <!-- Wish Header -->
          <div class="bg-[#090514]/75 border border-[#a855f7]/30 rounded-xl p-2.5 mb-2.5 text-center flex flex-col gap-1">
            <span class="text-[10px] uppercase font-bold text-[#c084fc] tracking-widest">The Wish</span>
            <span class="text-xs text-white italic font-medium leading-snug">"{currentChoice.wish}"</span>
          </div>

          <!-- Image Wrapper -->
          {#if currentChoice.image}
            <div class="relative flex-grow rounded-xl overflow-hidden border border-[#a855f7]/40 shadow-md aspect-video max-h-[30vh]">
              <img
                src={currentChoice.image}
                alt="Twist Visual"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
            </div>
          {/if}

          <!-- Twist / Catch Footer -->
          <div class="bg-[#2e0c1f]/75 border border-[#ec4899]/30 rounded-xl p-3 mt-3 text-center flex flex-col gap-1.5">
            <div class="flex items-center justify-center gap-2">
              {#if currentChoice.saboteurSelfie}
                <img src={currentChoice.saboteurSelfie} alt={currentChoice.saboteur} class="w-6 h-6 rounded-full object-cover border border-white/20" />
              {:else}
                <div class="w-6 h-6 rounded-full bg-pink-900 flex items-center justify-center text-[10px] font-bold border border-white/20 text-[#fca5a5]">
                  {currentChoice.saboteur ? currentChoice.saboteur.charAt(0).toUpperCase() : ""}
                </div>
              {/if}
              <span class="text-[10px] uppercase font-black text-[#f472b6] tracking-widest">The Twist by {currentChoice.saboteur}</span>
            </div>
            <span class="text-sm text-[#fef08a] font-extrabold leading-snug">"{currentChoice.catch}"</span>
          </div>
        </div>
      {/key}
    </div>
  {/if}

  <!-- Navigation & Voting Actions -->
  <div class="w-full mt-4 flex flex-col gap-3 select-none">
    <!-- Manual Navigation Arrows & Progress Dot Indicators -->
    <div class="flex items-center justify-between px-2 text-[#e9d5ff]">
      <button
        class="w-10 h-10 flex items-center justify-center rounded-full bg-[#1e1b4b] border border-[#a855f7]/50 active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all"
        on:click={prevCard}
        disabled={currentIndex === 0}
      >
        ◀
      </button>
      
      <span class="text-xs font-extrabold tracking-wider bg-[#0f172a] px-3 py-1 rounded-full border border-[#a855f7]/30">
        Option {currentIndex + 1} of {m_data?.answers?.length || 0}
      </span>
      
      <button
        class="w-10 h-10 flex items-center justify-center rounded-full bg-[#1e1b4b] border border-[#a855f7]/50 active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all"
        on:click={nextCard}
        disabled={!m_data?.answers || currentIndex === m_data.answers.length - 1}
      >
        ▶
      </button>
    </div>

    <!-- Submit Vote Button -->
    <button
      class="w-full py-3.5 bg-gradient-to-r from-[#a855f7] to-[#ec4899] hover:from-[#b55fe6] hover:to-[#f43f5e] text-white font-extrabold tracking-widest text-sm uppercase rounded-2xl shadow-xl hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] active:scale-[0.98] transition-all border border-[#f472b6]/30 flex items-center justify-center gap-2"
      on:click={submit_vote}
    >
      {#if currentChoice?.saboteurSelfie}
        <img src={currentChoice.saboteurSelfie} alt="" class="w-5 h-5 rounded-full object-cover border border-white/20" />
      {/if}
      Vote for {currentChoice?.saboteur || "this"}'s twist
    </button>
  </div>
</div>
