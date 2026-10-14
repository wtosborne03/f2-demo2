<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient, triggerGoogleSignIn } from "../../stores/authStore";
    import { toaster } from "$lib/util/toaster";
    import GoogleSignInButton from "./GoogleSignInButton.svelte";
    import AppleSignInButton from "./AppleSignInButton.svelte";
    import TwitchSignInButton from "./TwitchSignInButton.svelte";
    import { sideBarOpen } from "../../stores/sidebar";
    import SpotifySignInButton from "./SpotifySignInButton.svelte";
    import { Icon, NavigationRail } from "m3-svelte";
    import SideBarLink from "./SideBarLink.svelte";
    import { page } from "$app/state";
    import { browser } from "$app/environment";
    import Spinner from "./spinner.svelte";
    import Iconify from "@iconify/svelte";

    import iconPerson from "@ktibow/iconset-material-symbols/person";
    import iconLeaderboard from "@ktibow/iconset-material-symbols/leaderboard";
    import iconLogout from "@ktibow/iconset-material-symbols/logout";
    import iconImage from "@ktibow/iconset-material-symbols/image";
    import iconPause from "@ktibow/iconset-material-symbols/pause";
    import iconPlayArrow from "@ktibow/iconset-material-symbols/play-arrow";
    import iconMeetingRoom from "@ktibow/iconset-material-symbols/meeting-room";
    import { gameState, gameClient } from "$lib/wsapi/gameClient";

    const { signIn, signOut, useSession } = authClient;
    const session = useSession();

    const customizeAvatar = async () => {
        await goto("/avatar", { replaceState: false });
        sideBarOpen.set(false);
    };

    const goStats = async () => {
        await goto("/stats", { replaceState: false });
        sideBarOpen.set(false);
    };

    const goGallery = async () => {
        await goto("/gallery", { replaceState: false });
        sideBarOpen.set(false);
    };

    const signInWithGoogle = async () => {
        try {
            await triggerGoogleSignIn();
        } catch (error) {
            toaster.error({
                title: "Google Sign-In Failed",
                description:
                    error instanceof Error ? error.message : String(error),
            });
        }
    };

    const signInWithSpotify = async () => {
        try {
            const { data, error } = await signIn.social({
                provider: "spotify",
                callbackURL: window.location.href,
            });
            if (error) {
                toaster.error({
                    title: "Spotify Sign-In Failed",
                    description: error.message,
                });
                return;
            }
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            toaster.error({
                title: "Spotify Sign-In Failed",
                description:
                    error instanceof Error ? error.message : String(error),
            });
        }
    };

    const signInWithTwitch = async () => {
        try {
            const { data, error } = await signIn.social({
                provider: "twitch",
                callbackURL: window.location.href,
            });
            if (error) {
                toaster.error({
                    title: "Twitch Sign-In Failed",
                    description: error.message,
                });
                return;
            }
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            toaster.error({
                title: "Twitch Sign-In Failed",
                description:
                    error instanceof Error ? error.message : String(error),
            });
        }
    };

    const signInWithApple = async () => {
        try {
            const { data, error } = await signIn.social({
                provider: "apple",
                callbackURL: window.location.href,
            });
            if (error) {
                toaster.error({
                    title: "Apple Sign-In Failed",
                    description: error.message,
                });
                return;
            }
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            toaster.error({
                title: "Apple Sign-In Failed",
                description:
                    error instanceof Error ? error.message : String(error),
            });
        }
    };

    const goShop = async () => {
        await goto("/shop", { replaceState: false });
        sideBarOpen.set(false);
    };

    $: admin = $gameState.admin;
    $: paused = $gameState.paused;
    $: isGameRunning =
        $gameState.inGame ??
        ($gameState.screen !== "" &&
            $gameState.screen !== "index" &&
            $gameState.screen !== "start" &&
            $gameState.screen !== "can_start" &&
            $gameState.screen !== "room_ended" &&
            $gameState.screen !== "kicked");

    let showExitModal = false;

    const handlePause = () => {
        gameClient.pauseGame();
    };

    const handleResume = () => {
        gameClient.resumeGame();
        sideBarOpen.set(false);
    };

    const openExitModal = () => {
        showExitModal = true;
    };

    const confirmExit = () => {
        showExitModal = false;
        gameClient.exitGame();
        sideBarOpen.set(false);
        toaster.info({
            title: "Exiting Game",
            description: "Returning to lobby...",
        });
    };
</script>

<div class="rail-wrapper" class:open={$sideBarOpen}>
    <NavigationRail bind:open={$sideBarOpen} collapse="full" modal>
        {#if $session.isPending && browser && document.cookie.includes("better-auth")}
            <div class="user-info py-4">
                <Spinner />
            </div>
        {:else if $session.data?.user}
            <div
                class="flex flex-col gap-2 m-3 mt-2 p-3 bg-white border-3 border-[#121212] shadow-[4px_4px_0px_#121212]"
            >
                <div
                    class="flex items-center justify-between border-b-2 border-[#121212] pb-1"
                >
                    <span
                        class="font-headline text-xs font-black uppercase tracking-wider text-[#121212]"
                        >Player</span
                    >
                    <span
                        class="font-mono text-[10px] font-bold text-[#1040C0] uppercase tracking-widest"
                        >ONLINE</span
                    >
                </div>
                <span
                    class="flex w-full justify-start font-headline text-lg font-black uppercase tracking-tight text-[#121212]"
                    >{$session.data.user.name}</span
                >
                <span
                    class="flex gap-2 justify-start items-center font-mono text-xs font-bold text-[#121212]/75"
                    ><Iconify
                        icon="mdi:email-outline"
                        font-size="1.15rem"
                        class="text-[#121212]"
                    /><span class="overflow-hidden text-ellipsis"
                        >{$session.data?.user?.email}</span
                    ></span
                >
            </div>
        {:else}
            <div
                class="flex flex-col gap-2.5 m-3 mt-2 p-3 bg-white border-3 border-[#121212] shadow-[4px_4px_0px_#121212]"
            >
                <div class="flex items-center justify-between">
                    <span
                        class="font-headline text-xs font-black uppercase tracking-wider text-[#121212]"
                        >Sign In</span
                    >
                </div>
                <div class="w-full flex flex-col gap-2.5 pt-1">
                    <GoogleSignInButton onClick={signInWithGoogle} />
                    <AppleSignInButton onClick={signInWithApple} />
                    <TwitchSignInButton onClick={signInWithTwitch} />
                </div>
            </div>
        {/if}

        <SideBarLink
            label="Avatar"
            icon={iconPerson}
            active={page.url.pathname === "/avatar"}
            onclick={customizeAvatar}
            color="amber"
        />

        {#if $session.data?.user || ($session.isPending && browser && document.cookie.includes("better-auth"))}
            <SideBarLink
                label="Stats"
                icon={iconLeaderboard}
                active={page.url.pathname === "/stats"}
                onclick={goStats}
                color="emerald"
            />
            <SideBarLink
                label="Gallery"
                icon={iconImage}
                active={page.url.pathname === "/gallery"}
                onclick={goGallery}
                color="purple"
            />
        {/if}

        <div class="spacer"></div>

        {#if admin && isGameRunning}
            <div
                class="flex flex-col gap-2 m-3 mb-2 p-3 bg-white border-3 border-[#121212] shadow-[4px_4px_0px_#121212]"
            >
                <div
                    class="flex items-center justify-between border-b-2 border-[#121212] pb-1"
                >
                    <span
                        class="font-headline text-xs font-black uppercase tracking-wider text-[#121212]"
                        >Host Controls</span
                    >
                    {#if paused}
                        <span
                            class="font-mono text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse"
                            >PAUSED</span
                        >
                    {:else}
                        <span
                            class="font-mono text-[10px] font-black text-emerald-600 uppercase tracking-widest"
                            >RUNNING</span
                        >
                    {/if}
                </div>
                <div class="flex flex-col gap-2 pt-1">
                    {#if paused}
                        <button
                            type="button"
                            on:click={handleResume}
                            class="py-2.5 px-3 flex justify-between items-center bg-emerald-500 hover:bg-emerald-400 text-white border-2 border-[#121212] shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer font-headline text-xs font-black uppercase tracking-wider"
                        >
                            <span>Resume Game</span>
                            <Icon size={20} icon={iconPlayArrow} />
                        </button>
                    {:else}
                        <button
                            type="button"
                            on:click={handlePause}
                            class="py-2.5 px-3 flex justify-between items-center bg-amber-500 hover:bg-amber-400 text-black border-2 border-[#121212] shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer font-headline text-xs font-black uppercase tracking-wider"
                        >
                            <span>Pause Game</span>
                            <Icon size={20} icon={iconPause} />
                        </button>
                    {/if}

                    <button
                        type="button"
                        on:click={openExitModal}
                        class="py-2.5 px-3 flex justify-between items-center bg-rose-100 hover:bg-rose-200 text-rose-900 border-2 border-[#121212] shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer font-headline text-xs font-black uppercase tracking-wider"
                    >
                        <span>Exit to Lobby</span>
                        <Icon size={20} icon={iconMeetingRoom} />
                    </button>
                </div>
            </div>
        {/if}

        {#if $session.data?.user || ($session.isPending && browser && document.cookie.includes("better-auth"))}
            <SideBarLink
                label="Sign Out"
                icon={iconLogout}
                onclick={() => signOut()}
                color="rose"
            />
        {/if}
    </NavigationRail>
</div>

{#if showExitModal}
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-modal-title"
        on:click|self={() => (showExitModal = false)}
        on:keydown={(e) => {
            if (e.key === "Escape") showExitModal = false;
        }}
    >
        <div
            class="bg-white border-3 border-[#121212] shadow-[6px_6px_0px_#121212] p-5 max-w-sm w-full flex flex-col gap-3 font-headline transform transition-all"
        >
            <div
                class="flex items-center gap-2.5 border-b-2 border-[#121212] pb-2 text-rose-600"
            >
                <Icon size={26} icon={iconMeetingRoom} />
                <h3
                    id="exit-modal-title"
                    class="font-black text-lg uppercase tracking-tight text-[#121212]"
                >
                    Exit to Lobby?
                </h3>
            </div>

            <p
                class="font-sans text-sm font-semibold text-[#121212]/80 leading-snug"
            >
                This will end the current game for all players and return everyone to the lobby. Are you sure?
            </p>

            <div class="flex gap-2.5 pt-2 justify-end">
                <button
                    type="button"
                    on:click={() => (showExitModal = false)}
                    class="py-2 px-4 border-2 border-[#121212] bg-gray-100 hover:bg-gray-200 text-[#121212] font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer font-headline"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    on:click={confirmExit}
                    class="py-2 px-4 border-2 border-[#121212] bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider shadow-[2px_2px_0px_#121212] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer font-headline"
                >
                    Exit Game
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .rail-wrapper {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        justify-content: stretch;
        align-items: stretch;
        z-index: 60;
        width: 0;
        transition: width 300ms cubic-bezier(0.2, 0, 0, 1);
    }

    .rail-wrapper.open {
        width: 240px;
    }

    /* Force only the outer navigation rail container and background to show correctly */
    .rail-wrapper > :global(.m3-container) {
        width: 100% !important;
        height: 100% !important;
    }

    .rail-wrapper :global(.rail) {
        background-color: var(--b-white, #ffffff) !important;
        border-right: 4px solid var(--b-black, #121212) !important;
        box-shadow: 6px 0px 0px var(--b-black, #121212) !important;
        width: 100% !important;
        height: 100% !important;
        visibility: visible !important;
        padding-top: var(--safe-area-top) !important;
        padding-bottom: var(--safe-area-bottom) !important;
        padding-left: var(--safe-area-left) !important;
        box-sizing: border-box !important;
    }

    /* Hide default toggle button from M3 NavigationRail */
    :global(.rail-wrapper .toggle) {
        display: none !important;
    }

    .rail-wrapper :global(.rail.open .items) {
        opacity: 1 !important;
        width: 100% !important;
        height: 100% !important;
    }

    .user-info,
    .signin-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1.5rem 0.75rem 0.75rem 0.75rem;
        width: 100%;
        box-sizing: border-box;
    }

    .user-email {
        font-family: var(--font-mono);
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--b-black, #121212);
        text-align: center;
        word-break: break-all;
        max-width: 200px;
    }

    .signin-title {
        font-family: var(--font-headline);
        font-size: 1.25rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: -0.02em;
        color: var(--b-black, #121212);
    }

    .spacer {
        flex-grow: 1;
    }

    .signin-options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        padding: 1rem;
        box-sizing: border-box;
        align-items: center;
    }

    .signin-options :global(button) {
        width: 100%;
        max-width: 180px;
    }
</style>
