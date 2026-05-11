import { BaseBox } from './base.svelte.js';

/**
 * The public type returned by the {@link fastbox} factory. Currently a plain
 * alias for `FastBox<T>` since `FastBox` performs no transparent property
 * forwarding. Kept as a named alias so users can write
 * `function foo(b: FastBoxed<number>)` mirroring the {@link Boxed} convention,
 * and so the factory return type stays decoupled from the class.
 *
 * ### `FastBoxed<T>` vs `FastBox<T>`
 *
 * Unlike `Boxed<T>` vs `Box<T>`, this distinction is currently cosmetic:
 * `FastBoxed<T> = FastBox<T>` with no extra shape. Pick whichever reads
 * better:
 *
 * - **`FastBoxed<T>`** for symmetry with `Boxed<T>` at factory boundaries
 *   and in public APIs, so the type names line up if you later switch a
 *   given call site from `FastBox` to `Box` (note: the runtime behavior
 *   changes too — proxy, callability, and `instanceof` propagation come
 *   with `Box`).
 * - **`FastBox<T>`** for parameter types, matching how you would write
 *   `Box<T>` for the same role.
 *
 * They are assignment-compatible in both directions, so a refactor between
 * the two has no runtime or type effect today.
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
export declare class FastBox<T> extends BaseBox<T> {}

/**
 * Factory equivalent to `new FastBox(value)`. Returns a {@link FastBoxed}
 * (currently a plain `FastBox<T>` alias, no transparent forwarding).
 * Preferred over `new FastBox(...)` so call sites read the same as the
 * `box(...)`, `boxedMap(...)`, `boxedSet(...)`, `fastBoxedMap(...)`, and
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
export declare function fastbox<T>(initial: T): FastBoxed<T>;
