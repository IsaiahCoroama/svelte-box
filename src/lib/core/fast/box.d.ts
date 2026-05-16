import { BaseBox } from '../base.svelte.js';
import type { ConstFastBox } from './const.svelte.js';

/**
 * Reactive container with the same `.value` surface and helpers as
 * {@link BaseBox} (and {@link Box}), without a runtime Proxy. No
 * transparent forwarding, no callability for function values, no
 * bound-method cache, no proxy-mediated `instanceof` (plain prototype
 * checks). Per-operation overhead is lower; construction is several
 * times faster than `Box`.
 *
 * Use `FastBox` when:
 * - Reads and writes go through `.value` only.
 * - No need for transparent forwarding or inner-function calls.
 * - Many instances and construction throughput matters.
 *
 * Use `Box` for any proxy-driven behavior. Migration is mechanical: the
 * helper methods and type guards share names and signatures.
 *
 * @remarks
 * Helper-name collisions with inner methods are destructive on
 * `FastBox`. Without a forwarding proxy, `fb.set(k, v)` on a
 * `FastBox<Map<K, V>>` invokes `BaseBox.set(value)` and overwrites
 * `fb.value` with `k`. Always reach inner Map/Set methods through
 * `.value`: `fb.value.set(k, v)`.
 *
 * Prefer the {@link fastbox} factory over `new FastBox(...)`.
 *
 * @example
 * ```ts
 * import { fastbox } from '@coroama/svelte-box';
 *
 * const count = fastbox(0);
 *
 * function increment(c: FastBox<number>) {
 *   c.value += 1;
 * }
 * ```
 */
export declare class FastBox<T> extends BaseBox<T> {
    /**
     * Read-only plain {@link ConstFastBox} borrowing this cell so the
     * view stays reactive to source updates. Lets a `FastBox` pass where
     * a `ConstFastBox` is required without giving up reactivity. No
     * proxy: reach inner-object properties through `.value`.
     */
    toConst(): ConstFastBox<T>;
}

/**
 * Factory equivalent to `new FastBox(value)`. Preferred for symmetry
 * with the `box`, `boxedMap`, `boxedSet`, and `fastBoxed*` factories.
 *
 * @example
 * ```ts
 * import { fastbox } from '@coroama/svelte-box';
 *
 * const flag = fastbox(false);
 * flag.value = true;
 * ```
 */
export declare function fastbox<T>(initial: T): FastBox<T>;
