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
                callbackURL: `${window.location.origin}/`,
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
            const redirectTo = `${window.location.origin}/`;
            const { data, error } = await signIn.social({
                provider: "twitch",
                callbackURL: redirectTo,
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
                callbackURL: `${window.location.origin}/`,
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

            <div class="spacer"></div>

            <SideBarLink
                label="Sign Out"
                icon={iconLogout}
                onclick={() => signOut()}
                color="rose"
            />
        {/if}
    </NavigationRail>
</div>

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
