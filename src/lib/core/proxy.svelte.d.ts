import { BaseBox } from './base.svelte.js';

/**
 * Shape of the transparent forwarding layer applied to a {@link Box} value.
 * Functions become callable, objects expose their own properties, and
 * primitives keep the Box surface only.
 */
type ForwardShape<T> = T extends (...args: infer A) => infer R
	? (...args: A) => R
	: T extends object
		? T
		: unknown;

/**
 * The transparent type of a {@link Box}. When `T` is an object, function, or
 * array, `Boxed<T>` exposes `T`'s own properties directly on the Box instance
 * via a runtime Proxy, so `box.foo` reads `box.value.foo`, and `box(...)` or
 * `new box(...)` invokes or constructs the inner function.
 *
 * For primitives, only the `Box<T>` surface is typed. Read or write the
 * underlying value through `box.value`. Primitive prototype methods like
 * `String.prototype.toUpperCase` still work at runtime, the type just
 * narrows to the safer surface so you do not accidentally treat a primitive
 * box as the primitive itself.
 */
export type Boxed<T> = Box<T> & ForwardShape<T>;

/**
 * Reactive container for any value. Wraps Svelte 5 `$state` so the value can
 * be passed across function, class, and component boundaries without losing
 * reactivity.
 *
 * Inherits the full surface of {@link BaseBox}. Adds these proxy-driven
 * behaviors on top:
 *
 * - **Transparent forwarding for objects and arrays.** `box.foo = 1` writes
 *   to the inner object's `foo`, fully reactive.
 * - **Callability for functions and classes.** `box(...)` invokes the
 *   inner function, `new box(...)` constructs the inner class.
 * - **`instanceof` propagation through subclasses.** `class Counter extends Box<number>`
 *   and `myCounter instanceof Counter` both work.
 * - **Method shadowing**: `get`, `set`, and `del` on Box are shadowed when
 *   the inner value has a callable method with one of those names. So
 *   `boxedMap.set(key, value)` calls `SvelteMap.set` rather than Box's
 *   helper. To replace the entire boxed value, use `box.value = newValue`.
 *
 * @example
 * ```ts
 * const count = new Box(0);
 *
 * function increment(b: Box<number>) {
 *   b.value++;
 * }
 * ```
 *
 * @example Transparent forwarding via the {@link box} factory:
 * ```ts
 * const user = box({ name: 'Ada', age: 36 });
 * user.name;     // 'Ada', forwarded from inner value
 * user.age++;    // reactive
 * ```
 *
 * @remarks
 * Box does not change `$state`'s async semantics. Reading `box.value` after
 * an `await` returns the current value at that moment. Writes across `await`
 * boundaries each trigger reactivity at the point they happen, which is what
 * you usually want for loading and progress states.
 */
export declare class Box<T> extends BaseBox<T> {}

/**
 * Factory equivalent to `new Box(value)`, returning the transparent
 * {@link Boxed} type so object properties of `value` are accessible on the
 * Box directly. Prefer this over `new Box(...)` when you want method or
 * property forwarding to show up in TypeScript.
 */
export declare const box: <T>(initial: T) => Boxed<T>;
