<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient } from "../../stores/authStore";
    import Icon from "@iconify/svelte";
    import { Button, Card } from "m3-svelte";
    import UserImageGrid from "$lib/components/UserImageGrid.svelte";
    import GoogleSignInButton from "$lib/components/GoogleSignInButton.svelte";
    import SpotifySignInButton from "$lib/components/SpotifySignInButton.svelte";
    import { toaster } from "$lib/util/toaster";
    import { apiClient } from "$lib/backend/axios";
    import { browser } from "$app/environment";
    import Spinner from "$lib/components/spinner.svelte";
    import { dbClient } from "../../stores/apiClient";

    const session = authClient.useSession();
    const { signIn } = authClient;

    const initApi = async () => {
        const client = await apiClient;
        dbClient.set(client);
    };

    const signInWithGoogle = async () => {
        try {
            const redirectTo = `${window.location.origin}/gallery`;
            const { data, error } = await signIn.social({
                provider: "google",
                callbackURL: redirectTo,
            });
            if (error) {
                toaster.error({
                    title: "Google Sign-In Failed",
                    description: error.message,
                });
                return;
            }
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            toaster.error({
                title: "Google Sign-In Failed",
                description: error instanceof Error ? error.message : String(error),
            });
        }
    };

    const signInWithSpotify = async () => {
        try {
            const { data, error } = await signIn.social({
                provider: "spotify",
                callbackURL: `${window.location.origin}/gallery`,
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
                description: error instanceof Error ? error.message : String(error),
            });
        }
    };

    if (browser) {
        initApi();
    }
</script>

<div class="gallery-container">
    <div class="back-btn-wrapper">
        <Button variant="filled" onclick={() => goto("/")}>
            <Icon icon="lets-icons:back" style="font-size: 1.5rem;" />
        </Button>
    </div>

    <h1 class="gallery-title">Creation Gallery</h1>

    {#if $session.isPending && (browser && document.cookie.includes("better-auth"))}
        <div class="spinner-wrapper">
            <Spinner />
        </div>
    {:else if $session.data?.user}
        <div class="grid-container w-full">
            <UserImageGrid userId={$session.data.user.id} />
        </div>
    {:else}
        <div class="auth-prompt-wrapper">
            <Card variant="outlined">
                <div class="auth-card-content">
                    <div class="prompt-icon">🔒</div>
                    <h2 class="prompt-title">Sign In Required</h2>
                    <p class="prompt-desc">
                        Please log in to view your persistent history of generated images across all past
                        games.
                    </p>
                    <div class="signin-options">
                        <GoogleSignInButton onClick={signInWithGoogle} />
                        <SpotifySignInButton onClick={signInWithSpotify} />
                    </div>
                </div>
            </Card>
        </div>
    {/if}
</div>

<style>
    .gallery-container {
        padding: 2rem 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 48rem;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
    }

    .back-btn-wrapper {
        width: 100%;
        display: flex;
        justify-content: flex-start;
        margin-bottom: 1.5rem;
    }

    .gallery-title {
        font-family: var(--m3-font);
        font-size: 2rem;
        line-height: 1.286;
        font-weight: 800;
        color: var(--m3c-on-background);
        margin-top: 0;
        margin-bottom: 2rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .grid-container {
        width: 100%;
    }

    .auth-prompt-wrapper {
        width: 100%;
        max-width: 28rem;
        margin-top: 1.5rem;
    }

    .auth-card-content {
        padding: 2.5rem 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
    }

    .prompt-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .prompt-title {
        font-family: var(--m3-font);
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--m3c-on-surface);
        margin: 0 0 0.5rem 0;
    }

    .prompt-desc {
        font-family: var(--m3-font);
        font-size: 0.95rem;
        color: var(--m3c-on-surface-variant);
        line-height: 1.5;
        margin: 0 0 2rem 0;
    }

    .signin-options {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
        align-items: center;
    }

    .signin-options :global(button) {
        width: 100%;
        max-width: 15rem;
    }

    .spinner-wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 4rem 0;
        width: 100%;
    }
</style>
