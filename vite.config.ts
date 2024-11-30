import { sentrySvelteKit } from "@sentry/sveltekit";
import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite'

/** @type {import('vite').UserConfig} */
export default defineConfig({
	plugins: [sentrySvelteKit({
        sourceMapsUploadOptions: {
            org: "couchcup",
            project: "javascript-sveltekit"
        }
    }), sveltekit(), purgeCss(), Icons({ compiler: 'svelte' })],
	build: {
		sourcemap: true
	},
	mode: 'development',
});