import type { SvelteMap, SvelteSet } from 'svelte/reactivity';
import type { Boxed } from './proxy.svelte.js';
import type { FastBoxed } from './fast.svelte.js';

/**
 * A Box wrapping a `SvelteMap`. The map stays reactive on every `set`,
 * `delete`, and `clear`. The Box reference itself can be reassigned later
 * with `box.value = new SvelteMap(...)` if you need to swap the whole map
 * out without breaking subscribers.
 */
export type BoxedMap<K, V> = Boxed<SvelteMap<K, V>>;

/**
 * A Box wrapping a `SvelteSet`. The set stays reactive on every `add`,
 * `delete`, and `clear`. The Box reference itself can be reassigned later
 * with `box.value = new SvelteSet(...)`.
 */
export type BoxedSet<T> = Boxed<SvelteSet<T>>;

/**
 * A {@link FastBoxed} `SvelteMap`. The map is reactive on every `set`,
 * `delete`, and `clear`. Unlike {@link BoxedMap}, there is no Proxy, so
 * map methods are reached through `.value`: write
 * `m.value.set(k, v)`, `m.value.get(k)`, `m.value.delete(k)`. The Box
 * reference can still be replaced wholesale with
 * `m.value = new SvelteMap(...)`.
 */
export type FastBoxedMap<K, V> = FastBoxed<SvelteMap<K, V>>;

/**
 * A {@link FastBoxed} `SvelteSet`. Reactive on every `add`, `delete`, and
 * `clear`. No Proxy. Reach set methods through `.value`: write
 * `s.value.add(t)`, `s.value.has(t)`, etc. The Box reference can be
 * replaced with `s.value = new SvelteSet(...)`.
 */
export type FastBoxedSet<T> = FastBoxed<SvelteSet<T>>;

/**
 * Create a {@link BoxedMap}, a Box around a fresh `SvelteMap`. Mutations to
 * the map (`set`, `delete`, `clear`) are reactive.
 *
 * @param entries Optional initial entries, same shape as `Map`'s constructor.
 */
export declare const boxedMap: <K, V>(entries?: Iterable<readonly [K, V]> | null) => BoxedMap<K, V>;

/**
 * Create a {@link BoxedSet}, a Box around a fresh `SvelteSet`. Mutations to
 * the set (`add`, `delete`, `clear`) are reactive.
 *
 * @param values Optional initial values, same shape as `Set`'s constructor.
 */
export declare const boxedSet: <T>(values?: Iterable<T> | null) => BoxedSet<T>;

/**
 * Create a {@link FastBoxedMap}, a {@link FastBoxed} `SvelteMap`. Use this
 * when you do not need the transparent forwarding `boxedMap` provides and
 * want the lower per-instance cost of {@link FastBoxed}. Map methods must
 * be called through `.value`:
 *
 * ```ts
 * const m = fastBoxedMap<string, number>([['a', 1]]);
 * m.value.set('b', 2); // reactive
 * m.value.get('a'); // 1
 * ```
 *
 * @param entries Optional initial entries, same shape as `Map`'s constructor.
 */
export declare const fastBoxedMap: <K, V>(
	entries?: Iterable<readonly [K, V]> | null
) => FastBoxedMap<K, V>;

/**
 * Create a {@link FastBoxedSet}, a {@link FastBoxed} `SvelteSet`. Same
 * trade-off as {@link fastBoxedMap}: no Proxy, so set methods are reached
 * through `.value`:
 *
 * ```ts
 * const s = fastBoxedSet<string>(['a']);
 * s.value.add('b'); // reactive
 * s.value.has('a'); // true
 * ```
 *
 * @param values Optional initial values, same shape as `Set`'s constructor.
 */
export declare const fastBoxedSet: <T>(values?: Iterable<T> | null) => FastBoxedSet<T>;
