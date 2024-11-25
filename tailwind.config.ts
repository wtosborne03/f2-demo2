import { join } from 'path'
import type { Config } from 'tailwindcss'
import { skeleton } from '@skeletonlabs/tw-plugin'
import forms from '@tailwindcss/forms';

export default {
	darkMode: 'class',
	content: ['./src/**/*.{html,js,svelte,ts}', join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')],
	theme: {
		extend: {
			colors: {
				google: {
					'text-gray': '#3c4043',
					'button-blue': '#1a73e8',
					'button-blue-hover': '#5195ee',
					'button-dark': '#202124',
					'button-dark-hover': '#555658',
					'button-border-light': '#dadce0',
					'logo-blue': '#4285f4',
					'logo-green': '#34a853',
					'logo-yellow': '#fbbc05',
					'logo-red': '#ea4335',
				},
			},
		},
	},

	plugins: [
		forms,
		skeleton({
			themes: {
				preset: [
					{
						name: 'skeleton',
						enhancements: true,
					},
					{
						name: "gold-nouveau",
						enhancements: true,
					},
					{ name: "rocket", enhancements: true },
					{ name: "sahara", enhancements: true },
					{ name: "modern", enhancements: true },

				],
			},
		}),
	],
} satisfies Config;
