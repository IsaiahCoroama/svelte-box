import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		expect: { requireAssertions: true },
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [{ browser: 'chromium', headless: true }]
		},
		include: ['tests/**/*.svelte.{test,spec}.{js,ts}'],
		exclude: ['src/lib/server/**'],
		benchmark: {
			include: ['benchmarking/**/*.svelte.bench.{js,ts}']
		}
	}
});
