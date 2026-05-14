import { BaseBox } from '../base.svelte.js';
import type { ConstFastBox } from './const.svelte.js';

/**
 * @deprecated Since 0.2.2. Use {@link FastBox} directly. `FastBoxed<T>` was
 * a cosmetic alias for `FastBox<T>` introduced for symmetry with the
 * {@link Boxed} / {@link Box} pair, but `FastBox` performs no proxy
 * forwarding so there is no extra shape to project. The alias is kept for
 * backward compatibility and will be removed in 0.3.0. Migration:
 * replace every `FastBoxed<T>` with `FastBox<T>`. The two are
 * assignment-compatible, so the swap has no runtime or type effect.
 */
export type FastBoxed<T> = FastBox<T>;

/**
 * Reactive container with the same `.value` surface and helper methods as
 * {@link BaseBox} (and therefore {@link Box}), but without a runtime
 * Proxy. No transparent property forwarding, no callability for function
 * values, no bound-method cache, no proxy mediation of `instanceof` (it
 * uses plain prototype-chain checks). The result is a plain class with a
 * single reactive field and a fixed set of methods. Per-operation overhead
 * is lower and construction is several times faster than `Box`.
 *
 * Use `FastBox` when:
 * - You only read and write through `.value`.
 * - You do not need transparent forwarding of inner-object properties or
 *   inner-function calls.
 * - You construct many instances and care about construction throughput.
 *
 * Use `Box` when you need any of the proxy-driven behaviors. Migration
 * between the two is mechanical: the helper methods and type guards have
 * the same names and signatures.
 *
 * @remarks
 * Helper-name collisions with inner methods are destructive on `FastBox`.
 * Because there is no forwarding proxy, calling `fb.set(k, v)` on a
 * `FastBox<Map<K, V>>` invokes `BaseBox.set(value)` and overwrites
 * `fb.value` with `k` (the second argument is dropped). Always reach
 * inner Map/Set methods through `.value`: `fb.value.set(k, v)`. This
 * is one of the reasons {@link Box} exists.
 *
 * Prefer the {@link fastbox} factory over `new FastBox(...)` for symmetry
 * with the `box` / `boxedMap` / `boxedSet` factories and so call sites
 * stay consistent if you ever swap a `FastBox` for a `Box`.
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
     * Derive a read-only plain {@link ConstFastBox} capturing the
     * current value. Returns the no-proxy variant matching `FastBox`'s
     * own no-proxy semantics; reach inner-object properties on the
     * returned const view through `.value`.
     */
    const(): ConstFastBox<T>;
}

/**
 * Factory equivalent to `new FastBox(value)`. Preferred over
 * `new FastBox(...)` so call sites read the same as the `box(...)`,
 * `boxedMap(...)`, `boxedSet(...)`, `fastBoxedMap(...)`, and
 * `fastBoxedSet(...)` factories.
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
