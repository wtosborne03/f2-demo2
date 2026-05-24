import { sentrySvelteKit } from "@sentry/sveltekit";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite'
import tailwindcss from '@tailwindcss/vite';
import { functionsMixins } from "vite-plugin-functions-mixins";
import { tokenShaker } from "vite-plugin-token-shaker";
import fs from 'fs';

/** @type {import('vite').UserConfig} */
export default defineConfig({
    plugins: [
        { ...functionsMixins({ deps: ["m3-svelte"] }), enforce: 'pre' },
        { ...tokenShaker(), enforce: 'pre' },
        tailwindcss(),
        sveltekit(),
        Icons({ compiler: 'svelte' })
    ],
    build: {
        sourcemap: true
    },
    assetsInclude: ["**/*.riv"],
    server: {
        host: true,
        port: 5173,

        // https: {
        //     key: fs.readFileSync("./localhost+2-key.pem"),
        //     cert: fs.readFileSync("./localhost+2.pem"),
        // },
    },
    mode: 'development',
});