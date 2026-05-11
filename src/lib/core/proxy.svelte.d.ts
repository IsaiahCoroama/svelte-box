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
 *
 * ### `Boxed<T>` vs `Box<T>`
 *
 * `Box<T>` is the bare class. `Boxed<T>` is `Box<T> & ForwardShape<T>`, the
 * type the `box(...)` factory returns. Both wrap the same runtime value.
 * The difference is only what TypeScript shows you on the wrapper itself.
 *
 * - **Use `Boxed<T>`** when the caller benefits from seeing the inner
 *   value's properties or call signature directly on the Box: factory
 *   return types, locals from `box(...)`, public APIs that hand back a
 *   forwarded wrapper. This is what `box(...)` returns, so most call sites
 *   pick it up by inference and never have to write it.
 * - **Use `Box<T>`** for parameter types and any spot where the consumer
 *   only reaches the value through `.value` (or through Box's own
 *   helpers). `Box<T>` parameters accept `Boxed<T>` too.
 *
 * Rule of thumb: produce `Boxed<T>`, consume `Box<T>`.
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
 * Prefer the {@link box} factory over `new Box(...)`. The factory returns
 * the {@link Boxed} type, so transparent forwarding and callability show
 * up in TypeScript without a cast. Construct directly only when you need
 * the bare `Box<T>` surface (e.g. as a class field with `: Box<T>`).
 *
 * @example
 * ```ts
 * import { box } from '@coroama/svelte-box';
 *
 * const count = box(0);
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
export declare function box<T>(initial: T): Boxed<T>;
