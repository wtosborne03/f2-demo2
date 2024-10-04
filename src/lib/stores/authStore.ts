import { writable } from 'svelte/store';
import { supabase } from '../../supabaseClient'; // Adjust the path as necessary
import type { User } from '@supabase/supabase-js';

// Create a writable store to keep track of the authentication state
export const authStore = writable<{ session: any | null; user: User | null; loading: boolean }>({
    session: null,
    user: null,
    loading: true
});

// Subscribe to Supabase auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    authStore.set({ session, user: session?.user || null, loading: false });
});

// Initialize the store with the current session
(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    authStore.set({ session, user: session?.user || null, loading: false });
})();