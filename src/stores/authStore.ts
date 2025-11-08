import { get, writable } from 'svelte/store';
import { createAuthClient } from 'better-auth/svelte';
import { magicLinkClient, passkeyClient } from 'better-auth/client/plugins';
import { magicLink } from 'better-auth/plugins/magic-link';

// Create a writable store to keep track of the authentication state
export const authStore = writable<{ session: any | null; user: any | null; loading: boolean }>({
    session: null,
    user: null,
    loading: true
});

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_PUBLIC_API_URL,
    plugins: [
        magicLinkClient(),
    ]
});