import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Test-only config. Vitest picks `vitest.config.ts` over `vite.config.ts`
// automatically. We use `@sveltejs/vite-plugin-svelte` directly instead of
// the SvelteKit plugin because the lib unit tests do not import from `$lib`,
// do not exercise routing, and do not need the SvelteKit dev pipeline. The
// SvelteKit plugin holds chokidar watchers open past Vitest's force-close
// window and produces a "close timed out" warning at the end of every run.
export default defineConfig({
    plugins: [svelte()],
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
