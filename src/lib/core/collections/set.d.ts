import type { SvelteSet } from 'svelte/reactivity';
import type { Boxed } from '../proxy/box.js';
import type { ConstBoxed } from '../proxy/const.js';
import type { FastBox } from '../fast/box.js';
import type { ConstFastBox } from '../fast/const.svelte.js';

/**
 * A Box wrapping a `SvelteSet`. The set stays reactive on every `add`,
 * `delete`, and `clear`. The Box reference itself can be reassigned later
 * with `box.value = new SvelteSet(...)`.
 */
export type BoxedSet<T> = Boxed<SvelteSet<T>>;

/**
 * A {@link FastBox} around a `SvelteSet`. Reactive on every `add`,
 * `delete`, and `clear`. No Proxy. Reach set methods through `.value`:
 * write `s.value.add(t)`, `s.value.has(t)`, etc. The Box reference can
 * be replaced with `s.value = new SvelteSet(...)`.
 *
 * `FastBox` does not forward, so any inner-method names that collide
 * with `BaseBox` helpers stay destructive. `FastBoxedSet` is safer than
 * `FastBoxedMap` (Set has no `set` or `get`), but the same rule applies:
 * always go through `.value` for set methods.
 */
export type FastBoxedSet<T> = FastBox<SvelteSet<T>>;

/**
 * A {@link ConstBoxed} around a `SvelteSet`. The set reference is
 * frozen (writing `s.value = newSet` throws), but the underlying
 * `SvelteSet` stays reactive: forwarded method calls like
 * `s.add(t)` still mutate and trigger reactivity.
 */
export type ConstBoxedSet<T> = ConstBoxed<SvelteSet<T>>;

/**
 * A {@link ConstFastBox} around a `SvelteSet`. No Proxy, so reach set
 * methods through `.value` (`s.value.add(t)`). The reference is frozen
 * (`s.value = newSet` throws); the inner `SvelteSet` remains reactive
 * on mutation.
 */
export type ConstFastBoxedSet<T> = ConstFastBox<SvelteSet<T>>;

/**
 * Create a {@link BoxedSet}, a Box around a fresh `SvelteSet`. Mutations to
 * the set (`add`, `delete`, `clear`) are reactive.
 *
 * @param values Optional initial values, same shape as `Set`'s constructor.
 */
export declare function boxedSet<T>(values?: Iterable<T> | null): BoxedSet<T>;

/**
 * Create a {@link FastBoxedSet}, a {@link FastBox} around a `SvelteSet`.
 * Same trade-off as `fastBoxedMap`: no Proxy, so set methods are reached
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

/**
 * Create a {@link ConstBoxedSet}, a {@link ConstBox} around a fresh
 * `SvelteSet`. The set reference is frozen; the underlying contents
 * stay reactive through forwarded method calls (`s.add(t)`).
 *
 * @param values Optional initial values, same shape as `Set`'s constructor.
 */
export declare function constBoxedSet<T>(values?: Iterable<T> | null): ConstBoxedSet<T>;

/**
 * Create a {@link ConstFastBoxedSet}, a {@link ConstFastBox} around a
 * fresh `SvelteSet`. No Proxy; reach set methods through `.value`. The
 * reference is frozen; the inner set stays reactive on mutation.
 *
 * @param values Optional initial values, same shape as `Set`'s constructor.
 */
export declare function constFastBoxedSet<T>(values?: Iterable<T> | null): ConstFastBoxedSet<T>;
