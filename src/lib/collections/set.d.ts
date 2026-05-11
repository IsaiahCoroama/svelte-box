import type { SvelteSet } from 'svelte/reactivity';
import type { Boxed } from '../core/proxy.svelte.js';
import type { FastBoxed } from '../core/fast.svelte.js';

/**
 * A Box wrapping a `SvelteSet`. The set stays reactive on every `add`,
 * `delete`, and `clear`. The Box reference itself can be reassigned later
 * with `box.value = new SvelteSet(...)`.
 */
export type BoxedSet<T> = Boxed<SvelteSet<T>>;

/**
 * A {@link FastBoxed} `SvelteSet`. Reactive on every `add`, `delete`, and
 * `clear`. No Proxy. Reach set methods through `.value`: write
 * `s.value.add(t)`, `s.value.has(t)`, etc. The Box reference can be
 * replaced with `s.value = new SvelteSet(...)`.
 */
export type FastBoxedSet<T> = FastBoxed<SvelteSet<T>>;

/**
 * Create a {@link BoxedSet}, a Box around a fresh `SvelteSet`. Mutations to
 * the set (`add`, `delete`, `clear`) are reactive.
 *
 * @param values Optional initial values, same shape as `Set`'s constructor.
 */
export declare function boxedSet<T>(values?: Iterable<T> | null): BoxedSet<T>;

/**
 * Create a {@link FastBoxedSet}, a {@link FastBoxed} `SvelteSet`. Same
 * trade-off as `fastBoxedMap`: no Proxy, so set methods are reached
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
export declare function fastBoxedSet<T>(values?: Iterable<T> | null): FastBoxedSet<T>;
