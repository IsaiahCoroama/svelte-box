import type { SvelteSet } from 'svelte/reactivity';
import type { Boxed } from '../proxy/box.js';
import type { ConstBoxed } from '../proxy/const.js';
import type { FastBox } from '../fast/box.js';
import type { ConstFastBox } from '../fast/const.svelte.js';

/**
 * A Box wrapping a `SvelteSet`. Reactive on every `add`, `delete`, and
 * `clear`. Replace with `box.value = new SvelteSet(...)`.
 */
export type BoxedSet<T> = Boxed<SvelteSet<T>>;

/**
 * A {@link FastBox} around a `SvelteSet`. Reactive on every mutation.
 * No Proxy: reach methods through `.value` (`s.value.add(t)`,
 * `s.value.has(t)`). Replace with `s.value = new SvelteSet(...)`.
 *
 * `Set` has no `set` or `get`, so `FastBoxedSet` does not hit the same
 * destructive trap as `FastBoxedMap`. The "go through `.value`" rule
 * still applies.
 */
export type FastBoxedSet<T> = FastBox<SvelteSet<T>>;

/**
 * A {@link ConstBoxed} around a `SvelteSet`. Reference is frozen;
 * forwarded calls (`s.add(t)`) still mutate.
 */
export type ConstBoxedSet<T> = ConstBoxed<SvelteSet<T>>;

/**
 * A {@link ConstFastBox} around a `SvelteSet`. No Proxy; reach methods
 * through `.value`. Reference is frozen, inner set stays reactive.
 */
export type ConstFastBoxedSet<T> = ConstFastBox<SvelteSet<T>>;

/**
 * {@link BoxedSet}: Box around a fresh `SvelteSet`. Reactive on every
 * mutation (`add`, `delete`, `clear`).
 *
 * @param values Optional initial values, same shape as `Set`'s constructor.
 */
export declare function boxedSet<T>(values?: Iterable<T> | null): BoxedSet<T>;

/**
 * {@link FastBoxedSet}: {@link FastBox} around a fresh `SvelteSet`. Set
 * methods through `.value`:
 *
 * ```ts
 * const s = fastBoxedSet<string>(['a']);
 * s.value.add('b');
 * s.value.has('a');
 * ```
 *
 * @param values Optional initial values, same shape as `Set`'s constructor.
 */
export declare function fastBoxedSet<T>(values?: Iterable<T> | null): FastBoxedSet<T>;

/**
 * {@link ConstBoxedSet}: {@link ConstBox} around a fresh `SvelteSet`.
 * Reference is frozen; forwarded calls (`s.add(t)`) still mutate.
 *
 * @param values Optional initial values, same shape as `Set`'s constructor.
 */
export declare function constBoxedSet<T>(values?: Iterable<T> | null): ConstBoxedSet<T>;

/**
 * {@link ConstFastBoxedSet}: {@link ConstFastBox} around a fresh
 * `SvelteSet`. No Proxy; methods through `.value`. Reference is frozen,
 * inner set stays reactive.
 *
 * @param values Optional initial values, same shape as `Set`'s constructor.
 */
export declare function constFastBoxedSet<T>(values?: Iterable<T> | null): ConstFastBoxedSet<T>;
