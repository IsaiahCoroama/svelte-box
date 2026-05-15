import { BaseBox } from '../base.svelte.js';
import type { ConstBoxed } from './const.js';

/**
 * Transparent forwarding shape for a {@link Box} value. Functions become
 * callable, objects expose their own properties, primitives keep the
 * Box surface only.
 */
type Forwarded<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => R
    : T extends object
      ? T
      : unknown;

/**
 * Transparent type of a {@link Box}. When `T` is an object, function, or
 * array, `Boxed<T>` exposes `T`'s own properties directly on the Box via
 * a runtime Proxy. `box.foo` reads `box.value.foo`; `box(...)` or
 * `new box(...)` invokes or constructs the inner function.
 *
 * For primitives, only the `Box<T>` surface is typed; read or write
 * through `box.value`. Primitive prototype methods are **not**
 * forwarded: `box('hi').toUpperCase` is `undefined`. Reach them through
 * `.value`: `box('hi').value.toUpperCase()`.
 *
 * ### `Boxed<T>` vs `Box<T>`
 *
 * `Box<T>` is the bare class; `Boxed<T>` is `Box<T> & Forward<T>`, what
 * the `box(...)` factory returns. Both wrap the same runtime value; the
 * difference is what TypeScript shows on the wrapper.
 *
 * - **`Boxed<T>`** for factory returns, locals from `box(...)`, and
 *   public APIs handing back a forwarded wrapper. Inferred automatically
 *   at most call sites.
 * - **`Box<T>`** for parameter types or anywhere the consumer reads
 *   only through `.value` or Box's helpers. `Box<T>` accepts `Boxed<T>`.
 *
 * Rule of thumb: produce `Boxed<T>`, consume `Box<T>`.
 */
export type Boxed<T> = Box<T> & Forwarded<T>;

/**
 * Reactive container for any value. Wraps Svelte 5 `$state` so the value
 * can cross function, class, and component boundaries without losing
 * reactivity.
 *
 * Inherits {@link BaseBox}'s full surface. Adds proxy-driven behaviors:
 *
 * - **Transparent forwarding** for objects and arrays. `box.foo = 1`
 *   writes through to the inner object's `foo`.
 * - **Callability** for functions and classes. `box(...)` invokes,
 *   `new box(...)` constructs.
 * - **`instanceof` propagation** through subclasses. `class Counter
 *   extends Box<number>` and `myCounter instanceof Counter` both work.
 * - **Method shadowing**: `get`, `set`, and `del` are shadowed when the
 *   inner value exposes a callable method by the same name, so
 *   `boxedMap.set(k, v)` calls `SvelteMap.set`. Replace the whole value
 *   with `box.value = newValue`.
 *
 * Prefer the {@link box} factory: it returns {@link Boxed} so
 * forwarding and callability show up in TypeScript without a cast.
 * Construct directly only when you want the bare `Box<T>` surface.
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
 * @example Transparent forwarding via {@link box}:
 * ```ts
 * const user = box({ name: 'Ada', age: 36 });
 * user.name;     // 'Ada', forwarded
 * user.age++;    // reactive
 * ```
 *
 * @remarks
 * Box does not change `$state`'s async semantics. Reading `box.value`
 * after an `await` returns the value at that moment; writes across
 * `await` each trigger reactivity at the point they happen.
 */
export declare class Box<T> extends BaseBox<T> {
    /**
     * Read-only proxy-backed {@link ConstBoxed} borrowing this cell so
     * the view stays reactive to source updates. Lets a `Box` pass where
     * a `ConstBox` is required without giving up reactivity. Preserves
     * transparent forwarding on the const view.
     */
    const(): ConstBoxed<T>;
}

/**
 * Factory equivalent to `new Box(value)`, returning the transparent
 * {@link Boxed} type so forwarded properties show up in TypeScript.
 * Prefer this over `new Box(...)`.
 */
export declare function box<T>(initial: T): Boxed<T>;
