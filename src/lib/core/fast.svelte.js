import { BaseBox } from './base.svelte.js';

/**
 * Reactive container with the same surface as {@link BaseBox} and the same
 * helper methods as `Box`, but without a runtime Proxy. No transparent
 * forwarding, no callability, no bound-method cache. Use when you only
 * read and write through `.value` and want minimum per-instance cost.
 *
 * Functionally identical to `BaseBox`. Exported under a distinct name so
 * the choice between proxy-backed and plain is explicit at the type level.
 */
export class FastBox extends BaseBox {
	// Intentionally empty. The value of FastBox is what it is NOT: no proxy,
	// no forwarding, no callability. All behavior comes from BaseBox.
}

export const fastbox = (initial) => new FastBox(initial);
