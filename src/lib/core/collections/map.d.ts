import type { SvelteMap } from 'svelte/reactivity';
import type { Boxed } from '../proxy/box.js';
import type { ConstBoxed } from '../proxy/const.js';
import type { FastBox } from '../fast/box.js';
import type { ConstFastBox } from '../fast/const.svelte.js';

/**
 * A Box wrapping a `SvelteMap`. Reactive on every `set`, `delete`, and
 * `clear`. Swap the whole map with `box.value = new SvelteMap(...)`.
 */
export type BoxedMap<K, V> = Boxed<SvelteMap<K, V>>;

/**
 * A {@link FastBox} around a `SvelteMap`. Reactive on `set`, `delete`,
 * `clear`. No Proxy: reach map methods through `.value`
 * (`m.value.set(k, v)`, `m.value.get(k)`). Replace with
 * `m.value = new SvelteMap(...)`.
 *
 * Calling `m.set(k, v)` directly is a destructive trap: `FastBox.set`
 * overwrites `.value` with `k`. Same for `m.get(k)`. Always go through
 * `.value`.
 */
export type FastBoxedMap<K, V> = FastBox<SvelteMap<K, V>>;

/**
 * A {@link ConstBoxed} around a `SvelteMap`. The reference is frozen
 * (`m.value = newMap` throws), but the inner `SvelteMap` stays reactive:
 * forwarded calls like `m.set(k, v)` still mutate.
 */
export type ConstBoxedMap<K, V> = ConstBoxed<SvelteMap<K, V>>;

/**
 * A {@link ConstFastBox} around a `SvelteMap`. No Proxy, so reach map
 * methods through `.value`. The reference is frozen; the inner
 * `SvelteMap` stays reactive on mutation.
 */
export type ConstFastBoxedMap<K, V> = ConstFastBox<SvelteMap<K, V>>;

/**
 * {@link BoxedMap}: Box around a fresh `SvelteMap`. Reactive on every
 * mutation (`set`, `delete`, `clear`).
 *
 * @param entries Optional initial entries, same shape as `Map`'s constructor.
 */
export declare function boxedMap<K, V>(entries?: Iterable<readonly [K, V]> | null): BoxedMap<K, V>;

/**
 * {@link FastBoxedMap}: {@link FastBox} around a fresh `SvelteMap`. Use
 * for the lower per-instance cost of `FastBox`. Map methods are reached
 * through `.value`:
 *
 * ```ts
 * const m = fastBoxedMap<string, number>([['a', 1]]);
 * m.value.set('b', 2);
 * m.value.get('a');
 * ```
 *
 * @param entries Optional initial entries, same shape as `Map`'s constructor.
 */
export declare function fastBoxedMap<K, V>(
    entries?: Iterable<readonly [K, V]> | null
): FastBoxedMap<K, V>;

/**
 * {@link ConstBoxedMap}: {@link ConstBox} around a fresh `SvelteMap`.
 * Reference is frozen; forwarded calls (`m.set(k, v)`) still mutate.
 *
 * @param entries Optional initial entries, same shape as `Map`'s constructor.
 */
export declare function constBoxedMap<K, V>(
    entries?: Iterable<readonly [K, V]> | null
): ConstBoxedMap<K, V>;

/**
 * {@link ConstFastBoxedMap}: {@link ConstFastBox} around a fresh
 * `SvelteMap`. No Proxy; reach methods through `.value`. Reference is
 * frozen, inner map stays reactive.
 *
 * @param entries Optional initial entries, same shape as `Map`'s constructor.
 */
export declare function constFastBoxedMap<K, V>(
    entries?: Iterable<readonly [K, V]> | null
): ConstFastBoxedMap<K, V>;
