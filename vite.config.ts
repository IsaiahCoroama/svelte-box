import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

// Dev / build / svelte-package config. Test and coverage configuration
// lives in `vitest.config.ts`, which Vitest picks up automatically.
export default defineConfig({
    plugins: [sveltekit()]
});
