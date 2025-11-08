import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite'
import tailwindcss from '@tailwindcss/vite';

/** @type {import('vite').UserConfig} */
export default defineConfig({
    plugins: [tailwindcss(), sentrySvelteKit({
        sourceMapsUploadOptions: {
            org: "couchcup",
            project: "javascript-sveltekit"
        }
    }), sveltekit(), Icons({ compiler: 'svelte' })],
    build: {
        sourcemap: true
    },
    mode: 'development',
});