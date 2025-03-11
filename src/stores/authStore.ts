import { get, writable } from 'svelte/store';
import { supabase } from '../lib/config/supabaseClient'; // Adjust the path as necessary
import type { User } from '@supabase/supabase-js';

// Create a writable store to keep track of the authentication state
export const authStore = writable<{ session: any | null; user: User | null; loading: boolean }>({
    session: null,
    user: null,
    loading: true
});

// Initialize the store with the current session
(async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error fetching session:', error);
            authStore.set({ session: null, user: null, loading: false });
            return;
        }
        authStore.set({ session, user: session?.user || null, loading: false });
    } catch (err) {
        console.error('Unexpected error initializing session:', err);
        authStore.set({ session: null, user: null, loading: false });
    }
})();

// Subscribe to Supabase auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    authStore.update(store => ({
        session,
        user: session?.user || null,
        loading: store.loading
    }));
});
