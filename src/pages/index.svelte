<script lang="ts">
  import { joinRoom } from "$lib/gameService";
  import { browser } from "$app/environment";
  import logo from "$lib/assets/icons/logo.webp";
  import { drawerSettings } from "$lib/config/drawer";
  import { onMount } from "svelte";
  import { authClient } from "../stores/authStore";
  import { authDialog } from "../stores/dialog";

  const session = authClient.useSession();

  let roomCode = (browser && localStorage.getItem("code")) || "";
  let name = (browser && localStorage.getItem("name")) || "";

  const updateName = async (new_name: string) => {
    // const { error } = await supabase
    //   .from("users")
    //   .update({ game_name: new_name })
    //   .eq("id", $authStore.user?.id);
    // if (error) {
    //   console.error(error);
    // }
  };

  const fetchName = async () => {
    if ($session.data?.user === null) {
      return;
    }

    // if user has logged in
    // const { error, data } = await supabase
    //   .from("users")
    //   .select("*")
    //   .eq("id", $authStore.user?.id)
    //   .single();
    // if (error) {
    //   console.error(error);
    // } else {
    //   if (data.game_name === null && name !== "") {
    //     updateName(name);
    //   }
    //   if (data.game_name !== null) {
    //     name = data.game_name;
    //     localStorage.setItem("name", name);
    //   }
    // }
  };

  // authStore.subscribe((store) => {
  //   if (store.loading) {
  //     return;
  //   }
  //   fetchName();
  // });

  onMount(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("code") != null) {
      roomCode = sp.get("code") || "";
    }
  });

  //const drawerStore = getDrawerStore();

  const joinGame = async () => {
    name = name.substring(0, 10);
    name = name.trim();
    if ($session.data?.user === null) {
      //not logged in
    } else {
      //logged in, update the db name!
      updateName(name);
    }
    joinRoom(roomCode.toUpperCase(), name);
  };
</script>

<div class="w-full flex flex-row justify-end items-center">
  <button
    class="btn preset-filled"
    on:click={() => {
      authDialog.set(true);
    }}
    >{#if $session.data?.user}
      Account <i class="fa-solid fa-user ml-2"></i>
    {:else}
      Log In <i class="fa-solid fa-right-to-bracket ml-2"></i>
    {/if}
  </button>
</div>

<div class="container h-full mx-auto flex justify-center items-center">
  <div class="space-y-10 text-center flex flex-col items-center">
    <!-- Animated Logo -->
    <figure class="flex flex-col items-center h-72">
      <section class="img-bg" />
      <img src={logo} alt="logo" class="object-contain h-full" />
    </figure>
    <!-- / -->

    <div class="space-y-2">
      <label class="label"
        ><span>Room Code</span>
        <input
          type="text"
          class="input"
          id="p_code"
          style="text-transform:uppercase"
          name="Room Code"
          maxlength="4"
          bind:value={roomCode}
        />
      </label>
      <label class="label"
        ><span>Name</span>
        <input
          type="text"
          class="input"
          id="p_name"
          maxlength="10"
          name="Name"
          bind:value={name}
        />
      </label>
      <button class="btn preset-filled" id="joinButton" on:click={joinGame}
        >Join</button
      >
    </div>
  </div>
</div>
