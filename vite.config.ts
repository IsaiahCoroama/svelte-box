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
        coverage: {
            // V8 provider runs natively inside the browser project Vitest
            // already spawns. Coverage is collected against `src/lib` only;
            // the SvelteKit playground under `src/routes` is dev-only and
            // not part of the published surface.
            provider: 'v8',
            include: ['src/lib/**'],
            exclude: ['src/lib/**/*.d.ts'],
            reporter: ['text', 'html', 'lcov', 'json-summary'],
            thresholds: {
                lines: 90,
                statements: 90,
                functions: 90,
                branches: 80
            }
        },
        benchmark: {
            include: ['benchmarking/**/*.svelte.bench.{js,ts}']
        }
    }
});
