import { get, writable } from 'svelte/store';
import { createAuthClient } from 'better-auth/svelte';
import { magicLinkClient } from 'better-auth/client/plugins';
import { magicLink } from 'better-auth/plugins/magic-link';
import { withCapacitor } from 'better-auth-capacitor/client';

export const authClient = createAuthClient(
    withCapacitor({
        baseURL: import.meta.env.VITE_PUBLIC_API_URL,
        fetchOptions: { credentials: 'include' },
        plugins: [
        ]
    }, {
        scheme: 'couchcup',
    })
);