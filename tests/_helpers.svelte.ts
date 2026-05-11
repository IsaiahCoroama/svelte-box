// Test utilities, not a test file. The leading underscore is the project
// convention for non-test helpers under `tests/`. Vitest's include glob is
// `tests/**/*.svelte.{test,spec}.{js,ts}`, so this file is not discovered
// as a test. The `.svelte.ts` extension is still required because the body
// uses the `$effect.root` rune.

/**
 * Run `setup` inside an effect root and return the cleanup. Tests that wire
 * `$effect` need to call this from inside their `it(...)` body and call the
 * returned cleanup before the test finishes so the root is disposed.
 */
export function withRoot(setup: () => void): () => void {
	return $effect.root(() => {
		setup();
	});
}
