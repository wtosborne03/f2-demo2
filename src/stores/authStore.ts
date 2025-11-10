import { get, writable } from 'svelte/store';
import { createAuthClient } from 'better-auth/svelte';
import { magicLinkClient, passkeyClient } from 'better-auth/client/plugins';
import { magicLink } from 'better-auth/plugins/magic-link';

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_PUBLIC_API_URL,
    fetchOptions: { credentials: 'include' },
    plugins: [
    ]
});