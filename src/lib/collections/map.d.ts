import type { SvelteMap } from 'svelte/reactivity';
import type { Boxed } from '../core/proxy.svelte.js';
import type { FastBoxed } from '../core/fast.svelte.js';

/**
 * A Box wrapping a `SvelteMap`. The map stays reactive on every `set`,
 * `delete`, and `clear`. The Box reference itself can be reassigned later
 * with `box.value = new SvelteMap(...)` if you need to swap the whole map
 * out without breaking subscribers.
 */
export type BoxedMap<K, V> = Boxed<SvelteMap<K, V>>;

/**
 * A {@link FastBoxed} `SvelteMap`. The map is reactive on every `set`,
 * `delete`, and `clear`. Unlike {@link BoxedMap}, there is no Proxy, so
 * map methods are reached through `.value`: write
 * `m.value.set(k, v)`, `m.value.get(k)`, `m.value.delete(k)`. The Box
 * reference can still be replaced wholesale with
 * `m.value = new SvelteMap(...)`.
 *
 * Calling `m.set(k, v)` directly is a destructive trap: `FastBox.set`
 * takes a single argument and overwrites the whole `.value` with `k`,
 * dropping `v`. Always go through `m.value.set(k, v)` instead. Same for
 * `m.value.get(k)` over `m.get(k)`.
 */
export type FastBoxedMap<K, V> = FastBoxed<SvelteMap<K, V>>;

/**
 * Create a {@link BoxedMap}, a Box around a fresh `SvelteMap`. Mutations to
 * the map (`set`, `delete`, `clear`) are reactive.
 *
 * @param entries Optional initial entries, same shape as `Map`'s constructor.
 */
export declare function boxedMap<K, V>(entries?: Iterable<readonly [K, V]> | null): BoxedMap<K, V>;

/**
 * Create a {@link FastBoxedMap}, a `FastBoxed` `SvelteMap`. Use this
 * when you do not need the transparent forwarding `boxedMap` provides and
 * want the lower per-instance cost of `FastBoxed`. Map methods must
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
export declare function fastBoxedMap<K, V>(
    entries?: Iterable<readonly [K, V]> | null
): FastBoxedMap<K, V>;
