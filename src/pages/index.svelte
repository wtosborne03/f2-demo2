<script lang="ts">
  import { gameClient } from "$lib/wsapi/gameClient";
  import { browser } from "$app/environment";
  import logo from "$lib/assets/icons/logo.webp";
  import { onMount, onDestroy } from "svelte";
  import { authClient } from "../stores/authStore";
  import { sideBarOpen } from "../stores/sidebar";
  import { apiClient } from "$lib/backend/axios";
  import { get } from "svelte/store";
  import { toaster } from "$lib/util/toaster";
  import SelfieCapture from "$lib/components/SelfieCapture.svelte";
  import Icon from "@iconify/svelte";
  import { isKeyboardVisible } from "$lib/stores/keyboard";
  import { isCasting, getNativeCastingBridge } from "$lib/stores/casting";
  import { resolvePlayerProfile, type PlayerProfile } from "$lib/util/playerProfile";

  const session = authClient.useSession();

  let roomCode = "";
  let name = (browser && localStorage.getItem("name")) || "";
  $: if ($session.data?.user?.name && (!name || name === "Host")) {
    name = $session.data.user.name.substring(0, 10);
  }

  $: castingActive = $isCasting || (browser && (
    new URLSearchParams(window.location.search).has("isCasting") ||
    new URLSearchParams(window.location.search).has("cast") ||
    !!getNativeCastingBridge()?.isCasting?.()
  ));

  let step = "join"; // "join" | "selfie"
  let isChecking = false;

  const handleSessionCleared = () => {
    roomCode = "";
  };

  const updateName = async (new_name: string) => {
    try {
      const client = await apiClient;
      if (client) {
        await client.putUsersName({}, { name: new_name });
      }
    } catch (error) {
      console.error("Failed to update name:", error);
    }
  };

  const handleNativeRoomCode = async (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.code) {
      roomCode = detail.code.trim().toUpperCase();
      await autoJoinCasting();
    }
  };

  const autoJoinCasting = async () => {
    if (!roomCode || isChecking) return;
    const profile = await resolvePlayerProfile(name || "Host");
    name = profile.name;
    if (typeof window !== "undefined") {
      localStorage.setItem("name", name);
      localStorage.setItem("couch_room", roomCode);
    }
    await joinRoom(profile);
  };

  onMount(async () => {
    gameClient.on("sessionCleared", handleSessionCleared);

    if (typeof window !== "undefined") {
      window.addEventListener("nativeRoomCode", handleNativeRoomCode);
    }

    const sp = new URLSearchParams(window.location.search);
    const urlCode = sp.get("code");
    if (urlCode) {
      roomCode = urlCode.trim().toUpperCase();
      if (castingActive) {
        await autoJoinCasting();
        return;
      }
    }

    if (castingActive) {
      const nativeCode = getNativeCastingBridge()?.getRoomCode?.();
      if (nativeCode && !roomCode) {
        roomCode = nativeCode.trim().toUpperCase();
      }
      if (roomCode) {
        await autoJoinCasting();
        return;
      }
    }

    const storedCode =
      (browser &&
        (localStorage.getItem("code") || localStorage.getItem("couch_room"))) ||
      "";
    if (storedCode) {
      const check = await gameClient.checkRoom(storedCode);
      if (check.valid) {
        roomCode = storedCode.trim().toUpperCase();
        if (castingActive) {
          await autoJoinCasting();
        }
      } else {
        roomCode = "";
        if (browser) {
          localStorage.removeItem("code");
          localStorage.removeItem("couch_room");
          localStorage.removeItem("couch_pid");
        }
      }
    }
  });

  onDestroy(() => {
    gameClient.off("sessionCleared", handleSessionCleared);
    if (typeof window !== "undefined") {
      window.removeEventListener("nativeRoomCode", handleNativeRoomCode);
    }
  });

  const startJoinFlow = async () => {
    if (isChecking) return;

    roomCode = roomCode.trim().toUpperCase();
    name = name.substring(0, 10).trim();
    if (!roomCode || !name) {
      toaster.error({
        title: "Error",
        description: "Please enter both Room Code and Name.",
      });
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("name", name);
      localStorage.setItem("couch_room", roomCode);
    }

    isChecking = true;
    try {
      const check = await gameClient.checkRoom(roomCode);
      if (!check.valid) {
        toaster.error({
          title: "Cannot Join Room",
          description: check.error || "Room not found or no longer active.",
        });
        isChecking = false;
        return;
      }

      const profile = await resolvePlayerProfile(name);
      if (profile.avatar?.selfieUrl) {
        await joinRoom(profile);
        return;
      }
      step = "selfie";
    } catch (err) {
      console.error("Join flow error:", err);
      toaster.error({
        title: "Error",
        description: "Failed to verify room. Please try again.",
      });
    } finally {
      isChecking = false;
    }
  };

  const joinRoom = async (explicitProfile?: PlayerProfile) => {
    const profile = explicitProfile || (await resolvePlayerProfile(name));
    name = profile.name;
    const user = get(session).data?.user;
    if (user && name) {
      await updateName(name);
    }
    gameClient.join(roomCode.toUpperCase(), profile.name, profile.userId, profile.avatar);
  };
</script>

<div
  class="w-full absolute top-0 right-0 p-6 flex flex-row justify-end items-center transition-all duration-300 {$isKeyboardVisible
    ? 'opacity-0 pointer-events-none -translate-y-4'
    : 'opacity-100 translate-y-0'}"
  style="padding-top: calc(var(--safe-area-top) + 1.25rem); padding-right: calc(var(--safe-area-right) + 1.5rem);"
>
  <button
    type="button"
    class="btn btn-secondary btn-lg flex items-center gap-2"
    onclick={() => sideBarOpen.set(true)}
  >
    {#if $session.data?.user}
      <i class="fa-solid fa-circle-user text-xl"></i>
      <span>Account</span>
    {:else}
      <i class="fa-solid fa-right-to-bracket text-xl"></i>
      <span>Log In</span>
    {/if}
  </button>
</div>

<div
  class="flex flex-col items-center justify-center h-full w-full max-w-md px-6 flex-1 transition-all duration-300 {$isKeyboardVisible
    ? 'space-y-4 py-2'
    : 'space-y-8'}"
>
  <!-- Animated Logo (Pops out when keyboard is visible) -->
  <figure
    class="flex flex-col items-center overflow-hidden transition-all duration-300 ease-out origin-center {$isKeyboardVisible
      ? 'h-0 opacity-0 scale-75 mb-0 pointer-events-none'
      : 'h-64 opacity-100 scale-100 mb-0'}"
  >
    <img src={logo} alt="logo" class="object-contain h-full" />
  </figure>

  {#if castingActive}
    <div class="flex flex-col items-center justify-center gap-5 w-full max-w-sm text-center py-6 px-4 bg-white border-3 border-[#121212] shadow-[6px_6px_0px_#121212]">
      <div class="relative flex items-center justify-center">
        <div class="w-16 h-16 bg-[#F0C020] border-3 border-[#121212] shadow-[3px_3px_0px_#121212] flex items-center justify-center">
          <Icon icon="mdi:cast-connected" class="text-3xl text-[#121212]" />
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <h2 class="text-xl font-headline font-black uppercase tracking-wider text-[#121212]">
          Mirroring Active
        </h2>
        <p class="text-xs font-display font-bold text-[#121212]/80">
          {#if roomCode}
            Joining Room <span class="font-mono font-black text-black bg-[#ECE6DA] px-1.5 py-0.5 border border-[#121212]">{roomCode}</span> as Host...
          {:else}
            Connecting controller to TV screen...
          {/if}
        </p>
      </div>
      <div class="flex items-center gap-2 font-mono text-[11px] font-black text-[#121212]/70 uppercase tracking-widest pt-1">
        <span class="loading loading-spinner loading-xs"></span>
        <span>Syncing Game Session</span>
      </div>
    </div>
  {:else if step === "join"}
    <form
      class="flex flex-col w-full transition-all duration-300 {$isKeyboardVisible
        ? 'gap-4 mt-0'
        : 'gap-6 mt-6'}"
      onsubmit={(e) => {
        e.preventDefault();
        startJoinFlow();
      }}
    >
      <span
        class="flex justify-between items-center w-full input input-xl pr-0 border-3 border-[#121212] shadow-[4px_4px_0px_#121212] bg-white"
      >
        <label for="room-code-field" class="w-24 flex items-center gap-2 font-headline uppercase font-black tracking-wider text-sm"
          >Code</label
        >
        <input
          id="room-code-field"
          name="roomCode"
          type="text"
          bind:value={roomCode}
          maxlength={4}
          autocomplete="off"
          autocorrect="off"
          autocapitalize="characters"
          spellcheck="false"
          enterkeyhint={name.trim() ? "go" : "next"}
          class="input uppercase input-xl input-ghost font-mono font-bold tracking-widest text-xl"
          placeholder="ABCD"
          oninput={() => {
            roomCode = roomCode.toUpperCase();
          }}
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (roomCode.trim() && name.trim()) {
                startJoinFlow();
              } else if (roomCode.trim() && !name.trim()) {
                document.getElementById("name-field")?.focus();
              } else {
                startJoinFlow();
              }
            }
          }}
        />
      </span>
      <span
        class="flex justify-between items-center w-full input input-xl pr-0 border-3 border-[#121212] shadow-[4px_4px_0px_#121212] bg-white"
      >
        <label for="name-field" class="w-24 flex items-center gap-2 font-headline uppercase font-black tracking-wider text-sm">Name</label
        >

        <input
          id="name-field"
          name="name"
          type="text"
          bind:value={name}
          maxlength={10}
          autocomplete="nickname"
          autocorrect="off"
          autocapitalize="words"
          spellcheck="false"
          enterkeyhint="go"
          class="input input-xl input-ghost font-display font-bold text-lg"
          placeholder=""
          onkeydown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              startJoinFlow();
            }
          }}
        />
      </span>
      <button
        type="submit"
        class="btn btn-lg btn-primary flex items-center justify-center gap-2 font-headline tracking-wider text-lg shadow-[6px_6px_0px_#121212]"
        disabled={isChecking}
      >
        {#if isChecking}
          <span class="loading loading-spinner loading-sm"></span>
          <span>Checking Room...</span>
        {:else}
          <span>Join Game</span>
          <Icon icon="mingcute:enter-door-fill" class="mb-1" />
        {/if}
      </button>
    </form>
  {:else if step === "selfie"}
    <SelfieCapture
      initialMode="camera"
      roomCode={roomCode}
      playerName={name}
      onUploadComplete={() => joinRoom()}
      onSkip={() => joinRoom()}
    />
  {/if}
</div>
